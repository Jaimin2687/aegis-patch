import { simpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';
import { createLogger } from '../utils/logger.js';
import config from '../core/config.js';
import { parseDependencies } from '../utils/depGraph.js';

/**
 * Identifies the ecosystem of a repository based on manifest files
 * @param {string} repoPath 
 * @returns {Promise<string>} e.g., 'npm', 'PyPI', 'crates.io', 'Go'
 */
async function identifyEcosystem(repoPath) {
  try {
    const files = await fs.readdir(repoPath);
    if (files.includes('package.json')) return 'npm';
    if (files.includes('requirements.txt') || files.includes('pyproject.toml') || files.includes('Pipfile')) return 'PyPI';
    if (files.includes('Cargo.toml')) return 'crates.io';
    if (files.includes('go.mod')) return 'Go';
    if (files.includes('pom.xml') || files.includes('build.gradle')) return 'Java';
    if (files.includes('composer.json')) return 'PHP';
    if (files.includes('CMakeLists.txt') || files.includes('Makefile')) return 'C/C++';
  } catch (err) {
    // Ignore read errors
  }
  return 'UNIVERSAL';
}

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

  const ecosystem = await identifyEcosystem(repoPath);
  logger.info('CLONING', `Detected ecosystem: ${ecosystem}`);

  let packageJson = {};
  if (ecosystem === 'npm') {
    try {
      const pkgJsonContent = await fs.readFile(path.join(repoPath, 'package.json'), 'utf8');
      packageJson = JSON.parse(pkgJsonContent);
    } catch (err) {
      logger.warn('CLONING', 'No package.json found or failed to parse');
    }
  }

  let lockfileData = null;
  try {
    lockfileData = await parseDependencies(repoPath, ecosystem);
  } catch (err) {
    logger.warn('CLONING', `Failed to parse dependencies for ${ecosystem}: ${err.message}`);
  }

  return { repoPath, ecosystem, lockfileData, packageJson };
}
