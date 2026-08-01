import { simpleGit } from 'simple-git';
import { Octokit } from '@octokit/rest';
import config from '../core/config.js';
import { createLogger } from '../utils/logger.js';
import eventBus from '../core/eventBus.js';

function parseGitHubUrl(url) {
  const match = url.match(/github\.com[/:](.+?)\/(.+?)(\.git)?$/);
  if (!match) throw new Error('Invalid GitHub URL');
  return { owner: match[1], repo: match[2] };
}

/**
 * Commits changes and generates a PR on GitHub
 * @param {string} repoPath - Local path of the repo
 * @param {string} repoUrl - URL of the repository
 * @param {Array} vulnReports - Vulnerabilities addressed
 * @param {Object} regressionResult - Result of regression tests
 * @param {string} sessionId - Active session ID
 * @returns {Promise<Object>} Created PR details
 */
export async function generatePR(repoPath, repoUrl, vulnReports, regressionResult, sessionId) {
  const logger = createLogger(sessionId);
  logger.info('PUSHING', 'Generating Pull Request...');

  const { owner, repo } = parseGitHubUrl(repoUrl);
  const git = simpleGit(repoPath);
  
  await git.addConfig('user.name', 'AEGIS-PATCH Bot');
  await git.addConfig('user.email', 'bot@aegis-patch.local');

  const branchName = `aegis-patch/fix-${Date.now()}`;
  await git.checkoutLocalBranch(branchName);
  await git.add('.');
  await git.commit('fix: Patch security vulnerabilities');

  const remoteUrl = `https://x-access-token:${config.GITHUB_TOKEN}@github.com/${owner}/${repo}.git`;
  await git.addRemote('aegis-remote', remoteUrl);
  await git.push(['-u', 'aegis-remote', branchName]);

  const octokit = new Octokit({ auth: config.GITHUB_TOKEN });
  
  // Fetch default branch to avoid "base: invalid" error
  const repoData = await octokit.rest.repos.get({ owner, repo });
  const defaultBranch = repoData.data.default_branch || 'main';
  
  const cveList = vulnReports.map(v => `- **${v.packageName}**: ${v.cveId} (${v.title})`).join('\n');
  const body = `### AEGIS-PATCH Security Fixes

This PR was automatically generated to address the following vulnerabilities:
${cveList}

**Test Results:**
- Regression Tests Passed: ${regressionResult.passed ? 'Yes' : 'No'}

Please review the changes carefully.`;

  const pr = await octokit.rest.pulls.create({
    owner,
    repo,
    title: 'Security Patch: Vulnerability Fixes',
    head: branchName,
    base: defaultBranch,
    body
  });

  const prUrl = pr.data.html_url;
  logger.success('COMPLETE', `Pull Request created successfully: ${prUrl}`);
  
  eventBus.emitComplete(sessionId, { prUrl });
  
  return { prUrl, prNumber: pr.data.number };
}
