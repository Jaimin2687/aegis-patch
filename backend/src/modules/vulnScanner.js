import { request } from 'undici';
import { createLogger } from '../utils/logger.js';
import eventBus from '../core/eventBus.js';
import { runProcess } from '../utils/processRunner.js';
import { getPackageList } from '../utils/depGraph.js';

/**
 * Scans dependencies for vulnerabilities
 * @param {string} repoPath - Local path of the repo
 * @param {Object} lockfileData - Parsed lockfile object
 * @param {string} sessionId - Active session ID
 * @returns {Promise<Array>} Array of vulnerability reports
 */
export async function scanVulnerabilities(repoPath, lockfileData, sessionId) {
  const logger = createLogger(sessionId);
  logger.info('SCANNING', 'Starting vulnerability scan');
  
  const vulns = [];

  if (lockfileData && lockfileData.packages) {
    try {
      const packageList = getPackageList(lockfileData.packages);
      const queries = packageList.map(pkg => ({
        package: { name: pkg.name, ecosystem: 'npm' },
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
                  if (range.type === 'SEMVER') {
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
      logger.warn('SCANNING', `OSV API scan failed: ${err.message}. Falling back to npm audit.`);
    }
  }

  if (vulns.length === 0) {
    logger.info('SCANNING', 'Running npm audit fallback');
    const { exitCode, stdout } = await runProcess('npm', ['audit', '--json'], { cwd: repoPath });
    try {
      const auditResult = JSON.parse(stdout);
      if (auditResult.vulnerabilities) {
        for (const [pkgName, vulnObj] of Object.entries(auditResult.vulnerabilities)) {
          const report = {
            packageName: pkgName,
            installedVersion: vulnObj.version,
            patchedVersion: vulnObj.fixAvailable ? 'latest' : null,
            cveId: 'NPM-AUDIT',
            severity: vulnObj.severity,
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
  }

  logger.info('SCANNING', `Found ${vulns.length} vulnerabilities.`);
  return vulns;
}
