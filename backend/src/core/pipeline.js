import { ingestRepo } from '../modules/repoIngestor.js';
import { scanVulnerabilities } from '../modules/vulnScanner.js';
import { synthesizePatch } from '../modules/patchSynth.js';
import { runRegression } from '../modules/regressionEngine.js';
import { generatePR } from '../modules/prGenerator.js';
import { FailoverPipeline } from '../llm/failoverPipeline.js';
import { createLogger } from '../utils/logger.js';
import eventBus from './eventBus.js';
import config from './config.js';

/**
 * Orchestrates the full vulnerability patching pipeline
 * @param {string} repoUrl - Repository to process
 * @param {string} sessionId - Unique session ID
 */
export async function executePipeline(repoUrl, sessionId) {
  const logger = createLogger(sessionId);
  const startTime = Date.now();
  let repoPath, lockfileData, packageJson, ecosystem;
  let failoverPipeline;
  
  try {
    failoverPipeline = new FailoverPipeline(sessionId);
    
    eventBus.emitStageChange(sessionId, null, 'CLONING');
    ({ repoPath, lockfileData, packageJson, ecosystem } = await ingestRepo(repoUrl, sessionId));
    
    eventBus.emitStageChange(sessionId, 'CLONING', 'SCANNING');
    const vulns = await scanVulnerabilities(repoPath, lockfileData, ecosystem, failoverPipeline, sessionId);
    
    if (vulns.length === 0) {
      eventBus.emitComplete(sessionId, { patchedVulns: 0, totalTime: `${(Date.now() - startTime) / 1000}s` });
      return;
    }

    eventBus.emitStageChange(sessionId, 'SCANNING', 'PATCHING');
    let regressionResult = null;
    let patchedVulnsCount = 0;

    for (const vuln of vulns) {
      let previousStderr = null;
      let success = false;
      
      for (let attempt = 1; attempt <= config.MAX_RETRIES; attempt++) {
        logger.info('PATCHING', `Patching ${vuln.packageName} (Attempt ${attempt})`);
        
        await synthesizePatch(vuln, repoPath, ecosystem, failoverPipeline, sessionId, previousStderr);
        
        eventBus.emitStageChange(sessionId, 'PATCHING', 'TESTING');
        regressionResult = await runRegression(repoPath, ecosystem, sessionId);
        
        if (regressionResult.passed) {
          success = true;
          patchedVulnsCount++;
          break;
        } else {
          previousStderr = regressionResult.stderr;
          eventBus.emitStageChange(sessionId, 'TESTING', 'PATCHING');
        }
      }
      
      if (!success) {
        logger.error('TESTING', `Failed to patch ${vuln.packageName} after ${config.MAX_RETRIES} attempts.`);
      }
    }

    eventBus.emitStageChange(sessionId, 'TESTING', 'PUSHING');
    const prResult = await generatePR(repoPath, repoUrl, vulns, regressionResult || { passed: false }, sessionId);

    eventBus.emitStageChange(sessionId, 'PUSHING', 'COMPLETE');
    eventBus.emitComplete(sessionId, {
      prUrl: prResult.prUrl,
      patchedVulns: patchedVulnsCount,
      testsRun: 1, // Placeholder
      testsPassed: regressionResult?.passed ? 1 : 0,
      totalTime: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
      iterations: config.MAX_RETRIES
    });

    return prResult;
  } catch (error) {
    logger.error('ERROR', `Pipeline failed: ${error.message}`);
    eventBus.emitError(sessionId, error.message, 'UNKNOWN', true);
  }
}
