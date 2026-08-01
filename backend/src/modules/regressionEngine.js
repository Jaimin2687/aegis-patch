import { runProcess } from '../utils/processRunner.js';
import { createLogger } from '../utils/logger.js';
import config from '../core/config.js';

/**
 * Runs regression test suite on the patched repo
 * @param {string} repoPath - Local path of the repo
 * @param {string} sessionId - Active session ID
 * @returns {Promise<Object>} Regression test result
 */
export async function runRegression(repoPath, sessionId) {
  const logger = createLogger(sessionId);

  logger.info('TESTING', 'Installing dependencies...');
  await runProcess('npm', ['install', '--ignore-scripts'], { cwd: repoPath, timeout: 60000 });

  logger.info('TESTING', 'Running test suite...');
  const result = await runProcess('npm', ['test'], { 
    cwd: repoPath, 
    timeout: config.TEST_TIMEOUT_MS,
    env: { ...process.env, NODE_OPTIONS: `--max-old-space-size=${config.MAX_MEMORY_MB}` }
  });

  const passed = result.exitCode === 0;
  if (passed) {
    logger.success('TESTING', 'Test suite passed.');
  } else {
    logger.warn('TESTING', 'Test suite failed.');
  }

  return {
    passed,
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    timedOut: result.timedOut
  };
}
