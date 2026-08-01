import { runProcess } from '../utils/processRunner.js';
import { createLogger } from '../utils/logger.js';
import config from '../core/config.js';

/**
 * Runs regression test suite on the patched repo
 * @param {string} repoPath - Local path of the repo
 * @param {string} ecosystem - The detected ecosystem
 * @param {string} sessionId - Active session ID
 * @returns {Promise<Object>} Regression test result
 */
export async function runRegression(repoPath, ecosystem, sessionId) {
  const logger = createLogger(sessionId);

  logger.info('TESTING', `Installing dependencies for ${ecosystem}...`);
  
  let installCmd = { cmd: 'echo', args: ['"No install required"'] };
  let testCmd = { cmd: 'echo', args: ['"No test command defined"'] };
  let env = { ...process.env };

  switch (ecosystem) {
    case 'npm':
      installCmd = { cmd: 'npm', args: ['install', '--ignore-scripts'] };
      testCmd = { cmd: 'npm', args: ['test'] };
      env.NODE_OPTIONS = `--max-old-space-size=${config.MAX_MEMORY_MB || 4096}`;
      break;
    case 'PyPI':
      installCmd = { cmd: 'pip', args: ['install', '-r', 'requirements.txt'] };
      testCmd = { cmd: 'pytest', args: [] };
      break;
    case 'crates.io':
      installCmd = { cmd: 'cargo', args: ['build'] };
      testCmd = { cmd: 'cargo', args: ['test'] };
      break;
    case 'Go':
      installCmd = { cmd: 'go', args: ['mod', 'download'] };
      testCmd = { cmd: 'go', args: ['test', './...'] };
      break;
    case 'Java':
      installCmd = { cmd: 'gradle', args: ['build', '-x', 'test'] }; // fallback to mvn if needed
      testCmd = { cmd: 'gradle', args: ['test'] };
      break;
    case 'PHP':
      installCmd = { cmd: 'composer', args: ['install'] };
      testCmd = { cmd: 'composer', args: ['test'] };
      break;
    case 'C/C++':
      installCmd = { cmd: 'make', args: [] };
      testCmd = { cmd: 'make', args: ['test'] };
      break;
    case 'UNIVERSAL':
      logger.info('TESTING', 'Universal ecosystem detected, skipping automated tests (no known build system).');
      return { passed: true, exitCode: 0, stdout: 'Skipped tests for UNIVERSAL repo.', stderr: '', timedOut: false };
    default:
      logger.warn('TESTING', `Unknown ecosystem ${ecosystem}, skipping tests.`);
      return { passed: true, exitCode: 0, stdout: 'Skipped', stderr: '', timedOut: false };
  }

  await runProcess(installCmd.cmd, installCmd.args, { cwd: repoPath, timeout: 120000 }).catch(e => {
    logger.warn('TESTING', `Install command failed: ${e.message}`);
  });

  logger.info('TESTING', `Running test suite: ${testCmd.cmd} ${testCmd.args.join(' ')}`);
  const result = await runProcess(testCmd.cmd, testCmd.args, { 
    cwd: repoPath, 
    timeout: config.TEST_TIMEOUT_MS || 120000,
    env
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
