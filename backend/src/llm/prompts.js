/**
 * Builds the initial prompt for synthesizing a patch
 * @param {Object} args - Prompt arguments
 * @returns {Array} Array of message objects
 */
export function buildPatchPrompt({ vulnerableCode, cveId, cweType, cveDescription, fixCommitDiff, language = 'javascript' }) {
  return [
    {
      role: 'system',
      content: 'You are a senior security engineer. Your task is to patch vulnerable code. ONLY return the complete modified file content with no markdown formatting, no explanations, no wrapping code blocks.'
    },
    {
      role: 'user',
      content: `Please patch the following vulnerable code.
CVE ID: ${cveId || 'Unknown'}
CWE Type: ${cweType || 'Unknown'}
Description: ${cveDescription || 'No description available'}

Constraints:
- Preserve the existing API and functionality as much as possible.
- Do not introduce any new dependencies.
- Return ONLY the patched source code, no explanations or markdown backticks.
${fixCommitDiff ? `\nReference fix diff:\n${fixCommitDiff}` : ''}

Vulnerable ${language} Code:
${vulnerableCode}`
    }
  ];
}

/**
 * Builds the prompt for retrying a failed patch
 * @param {Object} args - Prompt arguments
 * @returns {Array} Array of message objects
 */
export function buildRetryPrompt({ previousPatch, stderrOutput, cveId, cweType }) {
  return [
    {
      role: 'system',
      content: 'You are a senior security engineer. Your task is to patch vulnerable code. ONLY return the complete modified file content with no markdown formatting, no explanations, no wrapping code blocks.'
    },
    {
      role: 'user',
      content: `The previous patch for CVE ${cveId} (CWE: ${cweType}) failed regression tests. 

Here is the previous patch:
${previousPatch}

Here is the test failure output:
${stderrOutput}

Please provide a corrected version of the code that resolves the test failures while maintaining the security patch. Remember, return ONLY the raw code.`
    }
  ];
}
