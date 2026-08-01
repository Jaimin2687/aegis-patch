import { simpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';
import { createLogger } from '../utils/logger.js';
import config from '../core/config.js';
import { parseLockfile } from '../utils/depGraph.js';

/**
 * Clones repository and extracts dependency data
 * @param {string} repoUrl - URL of the repository
 * @param {string} sessionId - Active session ID
 * @returns {Promise<Object>} Ingested repo details
 */
export async function ingestRepo(repoUrl, sessionId) {
  const logger = createLogger(sessionId);
  const backendRoot = process.cwd();
  const repoPath = path.join(backendRoot, 'temp', sessionId);

  logger.info('CLONING', `Cloning repository: ${repoUrl}`);

  let cloneUrl = repoUrl;
  if (config.GITHUB_TOKEN && repoUrl.includes('github.com')) {
    const urlObj = new URL(repoUrl);
    urlObj.username = 'x-access-token';
    urlObj.password = config.GITHUB_TOKEN;
    cloneUrl = urlObj.toString();
  }

  const git = simpleGit();
  await git.env('GIT_TERMINAL_PROMPT', '0').clone(cloneUrl, repoPath, ['--depth', '1', '--single-branch']);
  
  logger.info('CLONING', 'Repository cloned successfully');

  let packageJson = {};
  let lockfileData = null;

  try {
    const pkgJsonContent = await fs.readFile(path.join(repoPath, 'package.json'), 'utf8');
    packageJson = JSON.parse(pkgJsonContent);
  } catch (err) {
    logger.warn('CLONING', 'No package.json found or failed to parse');
  }

  const lockfilePath = path.join(repoPath, 'package-lock.json');
  try {
    lockfileData = await parseLockfile(lockfilePath);
  } catch (err) {
    logger.warn('CLONING', 'No package-lock.json found or failed to parse');
  }

  return { repoPath, lockfileData, packageJson };
}
