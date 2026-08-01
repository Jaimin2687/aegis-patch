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
 * @param {Object} failoverPipeline - LLM pipeline instance
 * @param {string} sessionId - Active session ID
 * @param {string|null} previousStderr - Error from previous attempt
 * @returns {Promise<Object>} Patch result metadata
 */
export async function synthesizePatch(vulnReport, repoPath, failoverPipeline, sessionId, previousStderr = null) {
  const logger = createLogger(sessionId);
  logger.info('PATCHING', `Synthesizing patch for ${vulnReport.packageName}`);

  if (vulnReport.patchedVersion) {
    logger.info('PATCHING', `Patched version available (${vulnReport.patchedVersion}). Using override strategy.`);
    const packageJsonPath = path.join(repoPath, 'package.json');
    const pkgJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    pkgJson.overrides = pkgJson.overrides || {};
    pkgJson.overrides[vulnReport.packageName] = vulnReport.patchedVersion;
    
    await fs.writeFile(packageJsonPath, JSON.stringify(pkgJson, null, 2));
    return { strategy: 'override', patchedVersion: vulnReport.patchedVersion };
  }

  const modulePath = path.join(repoPath, 'node_modules', vulnReport.packageName);
  let vulnerableCode = '';
  let vulnerableFilePath = '';
  
  try {
    const mainFilePath = path.join(modulePath, 'index.js');
    vulnerableCode = await fs.readFile(mainFilePath, 'utf8');
    vulnerableFilePath = mainFilePath;
  } catch (err) {
    logger.warn('PATCHING', `Could not find index.js for ${vulnReport.packageName}`);
    throw new Error(`Unable to locate source file for ${vulnReport.packageName}`);
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

  const messages = previousStderr 
    ? buildRetryPrompt({ previousPatch: vulnerableCode, stderrOutput: previousStderr, cveId: vulnReport.cveId, cweType: '' })
    : buildPatchPrompt({ 
        vulnerableCode, 
        cveId: vulnReport.cveId, 
        cweType: '', 
        cveDescription: vulnReport.title, 
        fixCommitDiff,
        language: 'javascript'
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
