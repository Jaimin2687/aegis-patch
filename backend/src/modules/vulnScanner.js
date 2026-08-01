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

              let cvssScore = 0;
              const cvssEntry = vulnData.severity?.find(s => s.type === 'CVSS_V3');
              if (cvssEntry && cvssEntry.score) {
                // E.g., CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H - OSV sometimes puts vector in score, we need to extract actual score if possible. Wait, OSV severity score is actually the vector string for CVSS_V3, but OSV api often has `score` field with the string. If we need to parse it, that's complex, but let's assume it might have the score or fallback to database_specific.
                // Re-reading task: "Look for vulnData.severity array, find entry with type: 'CVSS_V3', and parse the score field". I will just use `cvssEntry.score`.
                // Actually the task asks to parse the `score` field. In OSV, `score` for CVSS_V3 is the vector string. If the user just wants us to extract it, we can extract the number if possible or just use what we can. Let's just do what they said. Wait, `parseFloat` on vector will return NaN. We'll check if we can parse it, or just use `vulnData.database_specific?.cvss?.score`.
                const maybeScore = parseFloat(cvssEntry.score);
                if (!isNaN(maybeScore)) cvssScore = maybeScore;
              }
              if (!cvssScore && vulnData.database_specific?.cvss) {
                const dbSpecific = vulnData.database_specific.cvss;
                if (typeof dbSpecific === 'object' && dbSpecific.score) {
                   cvssScore = parseFloat(dbSpecific.score) || 0;
                } else if (typeof dbSpecific === 'number' || typeof dbSpecific === 'string') {
                   cvssScore = parseFloat(dbSpecific) || 0;
                }
              }

              const report = {
                packageName: packageList[i].name,
                installedVersion: packageList[i].version,
                patchedVersion,
                targetVersion: patchedVersion || 'latest',
                cveId,
                ghsaId: v.id,
                severity,
                cvssScore,
                title: vulnData.summary || vulnData.details || 'Vulnerability',
                description: vulnData.details || vulnData.summary || 'No detailed vulnerability description available for this advisory.',
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
          { role: 'user', content: `Identify security vulnerabilities in this code:\n${codebase.substring(0, 50000)}\n\nReturn an array of JSON objects matching this format: [{"cveId": "LLM-SAST-1", "title": "Description of vuln", "severity": "HIGH", "cvssScore": 7.5, "file": "path/to/file", "snippet": "vulnerable line of code"}]` }
        ];
        
        // Map severity strings to reasonable CVSS scores as fallback
        const severityCvssMap = { 'CRITICAL': 9.8, 'HIGH': 7.5, 'MEDIUM': 5.5, 'MODERATE': 5.5, 'LOW': 3.0 };

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
            const sev = (v.severity || 'UNKNOWN').toUpperCase();
            const cvss = parseFloat(v.cvssScore) || severityCvssMap[sev] || 0;
            const report = {
              packageName: 'source-code',
              installedVersion: 'N/A',
              patchedVersion: null,
              targetVersion: 'Patched',
              cveId: v.cveId || 'LLM-SAST',
              ghsaId: v.cveId || 'LLM-SAST',
              severity: sev,
              cvssScore: cvss,
              title: v.title || 'Vulnerability detected by LLM',
              description: v.title || 'Security vulnerability detected by AI-powered static analysis.',
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
