import fs from 'fs/promises';
import path from 'path';
import { request } from 'undici';
import { createLogger } from '../utils/logger.js';
import config from '../core/config.js';
import { buildPatchPrompt, buildRetryPrompt } from '../llm/prompts.js';

/**
 * Synthesizes a patch for a given vulnerability
 * @param {Object} vulnReport - Vulnerability report
 * @param {string} repoPath - Local path of the repo
 * @param {string} ecosystem - The detected ecosystem
 * @param {Object} failoverPipeline - LLM pipeline instance
 * @param {string} sessionId - Active session ID
 * @param {string|null} previousStderr - Error from previous attempt
 * @returns {Promise<Object>} Patch result metadata
 */
export async function synthesizePatch(vulnReport, repoPath, ecosystem, failoverPipeline, sessionId, previousStderr = null) {
  const logger = createLogger(sessionId);
  logger.info('PATCHING', `Synthesizing patch for ${vulnReport.packageName} in ecosystem ${ecosystem}`);

  // Attempt dependency override first
  if (vulnReport.patchedVersion) {
    logger.info('PATCHING', `Patched version available (${vulnReport.patchedVersion}). Attempting override strategy.`);
    try {
      if (ecosystem === 'npm') {
        const packageJsonPath = path.join(repoPath, 'package.json');
        const pkgJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
        pkgJson.overrides = pkgJson.overrides || {};
        pkgJson.overrides[vulnReport.packageName] = vulnReport.patchedVersion;
        await fs.writeFile(packageJsonPath, JSON.stringify(pkgJson, null, 2));
        return { strategy: 'override', patchedVersion: vulnReport.patchedVersion };
      } else if (ecosystem === 'PyPI') {
        const reqPath = path.join(repoPath, 'requirements.txt');
        let reqs = await fs.readFile(reqPath, 'utf8');
        // Simple regex replace for requirements.txt (e.g. pkg==1.0.0 -> pkg==patched)
        const regex = new RegExp(`^(${vulnReport.packageName})[=<>~]+.*$`, 'm');
        if (regex.test(reqs)) {
          reqs = reqs.replace(regex, `$1==${vulnReport.patchedVersion}`);
          await fs.writeFile(reqPath, reqs);
          return { strategy: 'override', patchedVersion: vulnReport.patchedVersion };
        }
      } else if (ecosystem === 'crates.io') {
        const cargoPath = path.join(repoPath, 'Cargo.toml');
        let cargo = await fs.readFile(cargoPath, 'utf8');
        // Add to [patch.crates-io] section (simplified approach)
        if (!cargo.includes('[patch.crates-io]')) {
           cargo += `\n\n[patch.crates-io]\n${vulnReport.packageName} = "${vulnReport.patchedVersion}"\n`;
           await fs.writeFile(cargoPath, cargo);
           return { strategy: 'override', patchedVersion: vulnReport.patchedVersion };
        }
      } else if (ecosystem === 'Go') {
        // Run go mod edit -replace
        const { runProcess } = await import('../utils/processRunner.js');
        await runProcess('go', ['mod', 'edit', '-replace', `${vulnReport.packageName}=${vulnReport.packageName}@v${vulnReport.patchedVersion}`], { cwd: repoPath });
        return { strategy: 'override', patchedVersion: vulnReport.patchedVersion };
      }
    } catch (err) {
      logger.warn('PATCHING', `Override failed for ${ecosystem}: ${err.message}. Falling back to LLM patch.`);
    }
  }

  // LLM Patch fallback (if no patched version or override failed)
  // For ecosystems other than npm, finding the source file dynamically is highly complex.
  // We'll implement a basic heuristic: look for a file containing the package name or just patch the first source file for demo purposes.
  
  let vulnerableCode = '';
  let vulnerableFilePath = '';
  
  try {
    if (vulnReport.vulnerableFile) {
      // Direct file path provided by Universal Scanner
      vulnerableFilePath = path.join(repoPath, vulnReport.vulnerableFile);
      vulnerableCode = await fs.readFile(vulnerableFilePath, 'utf8');
    } else if (ecosystem === 'npm') {
      vulnerableFilePath = path.join(repoPath, 'node_modules', vulnReport.packageName, 'index.js');
      vulnerableCode = await fs.readFile(vulnerableFilePath, 'utf8');
    } else {
       logger.warn('PATCHING', `Direct source patching for ${ecosystem} is limited. Using heuristic.`);
       const files = await fs.readdir(repoPath);
       let ext = ecosystem === 'PyPI' ? '.py' : ecosystem === 'Go' ? '.go' : ecosystem === 'crates.io' ? '.rs' : '.txt';
       // Find first source file
       let srcFile = files.find(f => f.endsWith(ext));
       if (!srcFile && ecosystem === 'crates.io') srcFile = 'src/main.rs';
       if (!srcFile && ecosystem === 'Go') srcFile = 'main.go';
       if (!srcFile) throw new Error("No source file found for patching");
       
       if (srcFile === 'src/main.rs') {
           vulnerableFilePath = path.join(repoPath, 'src', 'main.rs');
       } else {
           vulnerableFilePath = path.join(repoPath, srcFile);
       }
       vulnerableCode = await fs.readFile(vulnerableFilePath, 'utf8');
    }
  } catch (err) {
    logger.warn('PATCHING', `Could not find source code for ${vulnReport.packageName}`);
    throw new Error(`Unable to locate source file for ${vulnReport.packageName}: ${err.message}`);
  }

  let fixCommitDiff = null;
  if (vulnReport.fixCommitUrl) {
    try {
      const { statusCode, body } = await request(vulnReport.fixCommitUrl, {
        headers: { 'Accept': 'application/vnd.github.v3.diff' }
      });
      if (statusCode === 200) {
        fixCommitDiff = await body.text();
      }
    } catch (e) {
      logger.debug('PATCHING', 'Failed to fetch fix commit diff');
    }
  }

  const languageMap = {
      'npm': 'javascript',
      'PyPI': 'python',
      'crates.io': 'rust',
      'Go': 'go'
  };
  const language = languageMap[ecosystem] || 'javascript';

  const messages = previousStderr 
    ? buildRetryPrompt({ previousPatch: vulnerableCode, stderrOutput: previousStderr, cveId: vulnReport.cveId, cweType: '', language, ecosystem })
    : buildPatchPrompt({ 
        vulnerableCode, 
        cveId: vulnReport.cveId, 
        cweType: '', 
        cveDescription: vulnReport.title, 
        fixCommitDiff,
        language,
        ecosystem
      });

  const { content: patchContent, provider } = await failoverPipeline.generate(messages);

  await fs.writeFile(vulnerableFilePath, patchContent);

  return {
    patchedFilePath: vulnerableFilePath,
    patchContent,
    strategy: 'llm-patch',
    provider
  };
}
