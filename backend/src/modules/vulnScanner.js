import { request } from 'undici';
import { createLogger } from '../utils/logger.js';
import eventBus from '../core/eventBus.js';
import { runProcess } from '../utils/processRunner.js';
import { getPackageList } from '../utils/depGraph.js';

/**
 * Scans dependencies for vulnerabilities
 * @param {string} repoPath - Local path of the repo
 * @param {Object} lockfileData - Parsed lockfile object
 * @param {string} ecosystem - The detected ecosystem (e.g., 'npm', 'PyPI')
 * @param {Object} failoverPipeline - LLM pipeline for LLM SAST
 * @param {string} sessionId - Active session ID
 * @returns {Promise<Array>} Array of vulnerability reports
 */
export async function scanVulnerabilities(repoPath, lockfileData, ecosystem, failoverPipeline, sessionId) {
  const logger = createLogger(sessionId);
  logger.info('SCANNING', `Starting vulnerability scan for ecosystem: ${ecosystem}`);
  
  const vulns = [];

  // OSV.dev Scan
  if (lockfileData && lockfileData.packages && ecosystem !== 'UNKNOWN') {
    try {
      const packageList = getPackageList(lockfileData.packages);
      const queries = packageList.map(pkg => ({
        package: { name: pkg.name, ecosystem },
        version: pkg.version
      }));

      const { statusCode, body } = await request('https://api.osv.dev/v1/querybatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queries })
      });

      if (statusCode === 200) {
        const result = await body.json();
        for (let i = 0; i < result.results.length; i++) {
          const res = result.results[i];
          if (res.vulns) {
            for (const v of res.vulns) {
              const { body: vulnBody } = await request(`https://api.osv.dev/v1/vulns/${v.id}`);
              const vulnData = await vulnBody.json();
              
              const cveId = vulnData.aliases?.find(a => a.startsWith('CVE')) || v.id;
              const severity = vulnData.database_specific?.severity || 'UNKNOWN';
              
              let patchedVersion = null;
              if (vulnData.affected && vulnData.affected[0].ranges) {
                for (const range of vulnData.affected[0].ranges) {
                  // Different ecosystems use different range types in OSV (SEMVER, ECOSYSTEM)
                  if (range.type === 'SEMVER' || range.type === 'ECOSYSTEM') {
                    const fixedEvent = range.events.find(e => e.fixed);
                    if (fixedEvent) patchedVersion = fixedEvent.fixed;
                  }
                }
              }

              const fixCommitUrl = vulnData.references?.find(r => r.type === 'FIX')?.url;

              const report = {
                packageName: packageList[i].name,
                installedVersion: packageList[i].version,
                patchedVersion,
                cveId,
                ghsaId: v.id,
                severity,
                cvssScore: 0,
                title: vulnData.summary || vulnData.details || 'Vulnerability',
                fixCommitUrl,
                vulnData
              };
              
              vulns.push(report);
              eventBus.emitVulnFound(sessionId, report);
            }
          }
        }
      }
    } catch (err) {
      logger.warn('SCANNING', `OSV API scan failed: ${err.message}. Attempting fallback scanner.`);
    }
  }

  // Fallback Scanners based on ecosystem
  if (vulns.length === 0) {
    if (ecosystem === 'npm') {
      logger.info('SCANNING', 'Running npm audit fallback');
      const { exitCode, stdout } = await runProcess('npm', ['audit', '--json'], { cwd: repoPath });
      try {
        const auditResult = JSON.parse(stdout);
        if (auditResult.vulnerabilities) {
          for (const [pkgName, vulnObj] of Object.entries(auditResult.vulnerabilities)) {
            const report = {
              packageName: pkgName,
              installedVersion: vulnObj.version || 'unknown',
              patchedVersion: vulnObj.fixAvailable ? 'latest' : null,
              cveId: 'NPM-AUDIT',
              severity: vulnObj.severity || 'UNKNOWN',
              cvssScore: 0,
              title: `Vulnerability in ${pkgName}`
            };
            vulns.push(report);
            eventBus.emitVulnFound(sessionId, report);
          }
        }
      } catch (e) {
        logger.error('SCANNING', `npm audit parsing failed: ${e.message}`);
      }
    } else if (ecosystem === 'PyPI') {
      logger.info('SCANNING', 'Running pip-audit fallback (requires pip-audit installed)');
      const { exitCode, stdout } = await runProcess('pip-audit', ['-f', 'json'], { cwd: repoPath }).catch(() => ({ exitCode: 1, stdout: '' }));
      try {
        if (stdout) {
          const auditResult = JSON.parse(stdout);
          if (auditResult.dependencies) {
             for (const dep of auditResult.dependencies) {
               if (dep.vulns && dep.vulns.length > 0) {
                 for (const vuln of dep.vulns) {
                   const report = {
                     packageName: dep.name,
                     installedVersion: dep.version,
                     patchedVersion: vuln.fix_versions?.[0] || null,
                     cveId: vuln.id,
                     severity: 'UNKNOWN',
                     cvssScore: 0,
                     title: vuln.description || `Vulnerability in ${dep.name}`
                   };
                   vulns.push(report);
                   eventBus.emitVulnFound(sessionId, report);
                 }
               }
             }
          }
        }
      } catch (e) {
        logger.error('SCANNING', `pip-audit parsing failed: ${e.message}`);
      }
    } else if (ecosystem === 'crates.io') {
      logger.info('SCANNING', 'Running cargo audit fallback');
      const { stdout } = await runProcess('cargo', ['audit', '--json'], { cwd: repoPath }).catch(() => ({ stdout: '' }));
      try {
        if (stdout) {
          const auditResult = JSON.parse(stdout);
          if (auditResult.vulnerabilities?.list) {
            for (const vuln of auditResult.vulnerabilities.list) {
               const report = {
                 packageName: vuln.package.name,
                 installedVersion: vuln.package.version,
                 patchedVersion: vuln.versions?.patched?.[0] || null,
                 cveId: vuln.advisory.id,
                 severity: vuln.advisory.cvss?.severity || 'UNKNOWN',
                 cvssScore: vuln.advisory.cvss?.score || 0,
                 title: vuln.advisory.title || `Vulnerability in ${vuln.package.name}`
               };
               vulns.push(report);
               eventBus.emitVulnFound(sessionId, report);
            }
          }
        }
      } catch(e) {}
    } else if (ecosystem === 'Go') {
      logger.info('SCANNING', 'Running govulncheck fallback');
      const { stdout } = await runProcess('govulncheck', ['-json', './...'], { cwd: repoPath }).catch(() => ({ stdout: '' }));
      try {
        if (stdout) {
           const lines = stdout.split('\n').filter(l => l.trim().startsWith('{'));
           for (const line of lines) {
             const obj = JSON.parse(line);
             if (obj.osv) {
               const report = {
                 packageName: obj.osv.affected?.[0]?.package?.name || 'unknown',
                 installedVersion: 'unknown',
                 patchedVersion: null,
                 cveId: obj.osv.aliases?.[0] || obj.osv.id,
                 severity: 'UNKNOWN',
                 cvssScore: 0,
                 title: obj.osv.details || 'Go Vulnerability'
               };
               vulns.push(report);
               eventBus.emitVulnFound(sessionId, report);
             }
           }
        }
      } catch(e) {}
    } else if (ecosystem === 'UNIVERSAL' || ecosystem === 'C/C++' || ecosystem === 'PHP' || ecosystem === 'Java') {
      // LLM SAST Scan Fallback
      logger.info('SCANNING', `Running Universal LLM Scanner for ${ecosystem}`);
      const { runProcess } = await import('../utils/processRunner.js');
      // Find all source files, ignoring node_modules, .git, and binaries
      const { stdout } = await runProcess('find', ['.', '-type', 'f', '-not', '-path', '*/.git/*', '-not', '-path', '*/node_modules/*', '-not', '-name', '*.o', '-not', '-name', '*.bin', '-not', '-name', '*.so'], { cwd: repoPath });
      const files = stdout.split('\n').filter(Boolean).slice(0, 10); // Limit to 10 files for cost control in demo
      
      let codebase = '';
      const fs = await import('fs/promises');
      const path = await import('path');
      
      for (const file of files) {
        try {
          const content = await fs.readFile(path.join(repoPath, file), 'utf8');
          // Skip large files (e.g., > 100kb)
          if (content.length < 100000) {
            codebase += `\n\n--- FILE: ${file} ---\n${content}`;
          }
        } catch (err) {}
      }
      
      if (codebase.length > 0 && failoverPipeline) {
        const prompt = [
          { role: 'system', content: 'You are a Static Application Security Testing (SAST) tool. Analyze the provided codebase and identify security vulnerabilities. Respond strictly in JSON format.' },
          { role: 'user', content: `Identify security vulnerabilities in this code:\n${codebase.substring(0, 50000)}\n\nReturn an array of JSON objects matching this format: [{"cveId": "LLM-SAST-1", "title": "Description of vuln", "severity": "HIGH", "file": "path/to/file", "snippet": "vulnerable line of code"}]` }
        ];
        
        try {
          const { content } = await failoverPipeline.generate(prompt, { format: 'json' });
          let llmVulns = [];
          try {
            // strip markdown formatting if any
            const jsonStr = content.replace(/```json\n/g, '').replace(/```/g, '');
            llmVulns = JSON.parse(jsonStr);
          } catch(e) {
            console.error('LLM SAST JSON parsing failed', e);
          }
          
          for (const v of llmVulns) {
            const report = {
              packageName: 'source-code',
              installedVersion: 'N/A',
              patchedVersion: null,
              cveId: v.cveId || 'LLM-SAST',
              severity: v.severity || 'UNKNOWN',
              cvssScore: 0,
              title: v.title || 'Vulnerability detected by LLM',
              vulnerableFile: v.file, // Passed for patching
              vulnerableSnippet: v.snippet
            };
            vulns.push(report);
            eventBus.emitVulnFound(sessionId, report);
          }
        } catch (err) {
          logger.warn('SCANNING', `Universal LLM scan failed: ${err.message}`);
        }
      }
    }
  }

  logger.info('SCANNING', `Found ${vulns.length} vulnerabilities.`);
  return vulns;
}
