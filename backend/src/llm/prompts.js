/**
 * Builds the initial prompt for synthesizing a patch
 * @param {Object} args - Prompt arguments
 * @returns {Array} Array of message objects
 */
export function buildPatchPrompt({ vulnerableCode, cveId, cweType, cveDescription, fixCommitDiff, language = 'javascript', ecosystem = 'npm' }) {
  return [
    {
      role: 'system',
      content: 'You are a senior security engineer. Your task is to patch vulnerable code. ONLY return the complete modified file content with no markdown formatting, no explanations, no wrapping code blocks.'
    },
    {
      role: 'user',
      content: 'Please patch the following vulnerable code.\nCVE ID: CVE-2020-1\nCWE Type: Prototype Pollution\n\nConstraints:\n- Preserve the existing API and functionality as much as possible.\n- Do not introduce any new dependencies.\n- Return ONLY the patched source code, no explanations or markdown backticks.\n\nVulnerable javascript Code (npm ecosystem):\nfunction merge(target, source) {\n  for (let key in source) {\n    target[key] = source[key];\n  }\n  return target;\n}'
    },
    {
      role: 'assistant',
      content: 'function merge(target, source) {\n  for (let key in source) {\n    if (key === "__proto__" || key === "constructor" || key === "prototype") continue;\n    target[key] = source[key];\n  }\n  return target;\n}'
    },
    {
      role: 'user',
      content: 'Please patch the following vulnerable code.\nCVE ID: CVE-2020-2\nCWE Type: Command Injection\n\nConstraints:\n- Preserve the existing API and functionality as much as possible.\n- Do not introduce any new dependencies.\n- Return ONLY the patched source code, no explanations or markdown backticks.\n\nVulnerable javascript Code (npm ecosystem):\nconst exec = require("child_process").exec;\nfunction run(cmd) {\n  exec("ls " + cmd);\n}'
    },
    {
      role: 'assistant',
      content: 'const execFile = require("child_process").execFile;\nfunction run(cmd) {\n  execFile("ls", [cmd]);\n}'
    },
    {
      role: 'user',
      content: 'Please patch the following vulnerable code.\nCVE ID: CVE-2020-3\nCWE Type: SQL Injection\n\nConstraints:\n- Preserve the existing API and functionality as much as possible.\n- Do not introduce any new dependencies.\n- Return ONLY the patched source code, no explanations or markdown backticks.\n\nVulnerable javascript Code (npm ecosystem):\nfunction getUser(db, id) {\n  return db.query("SELECT * FROM users WHERE id = " + id);\n}'
    },
    {
      role: 'assistant',
      content: 'function getUser(db, id) {\n  return db.query("SELECT * FROM users WHERE id = ?", [id]);\n}'
    },
    {
      role: 'user',
      content: 'Please patch the following vulnerable code.\nCVE ID: CVE-2020-4\nCWE Type: Path Traversal\n\nConstraints:\n- Preserve the existing API and functionality as much as possible.\n- Do not introduce any new dependencies.\n- Return ONLY the patched source code, no explanations or markdown backticks.\n\nVulnerable javascript Code (npm ecosystem):\nconst fs = require("fs");\nfunction readFile(filepath) {\n  return fs.readFileSync(filepath);\n}'
    },
    {
      role: 'assistant',
      content: 'const fs = require("fs");\nconst path = require("path");\nfunction readFile(filepath) {\n  const safePath = path.resolve("/", filepath);\n  if (!safePath.startsWith("/")) throw new Error("Invalid path");\n  return fs.readFileSync(safePath);\n}'
    },
    {
      role: 'user',
      content: 'Please patch the following vulnerable code.\nCVE ID: CVE-2020-5\nCWE Type: ReDoS\n\nConstraints:\n- Preserve the existing API and functionality as much as possible.\n- Do not introduce any new dependencies.\n- Return ONLY the patched source code, no explanations or markdown backticks.\n\nVulnerable javascript Code (npm ecosystem):\nfunction checkEmail(email) {\n  return /^([a-zA-Z0-9])(([-.]|[_]+)?([a-zA-Z0-9]+))*(@){1}([a-z0-9]+)(\\.([a-z]{2,3}))+$/.test(email);\n}'
    },
    {
      role: 'assistant',
      content: 'function checkEmail(email) {\n  return /^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*$/.test(email);\n}'
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

Vulnerable ${language} Code (${ecosystem} ecosystem):
${vulnerableCode}`
    }
  ];
}

/**
 * Builds the prompt for retrying a failed patch
 * @param {Object} args - Prompt arguments
 * @returns {Array} Array of message objects
 */
export function buildRetryPrompt({ previousPatch, stderrOutput, cveId, cweType, language = 'javascript', ecosystem = 'npm' }) {
  return [
    {
      role: 'system',
      content: 'You are a senior security engineer. Your task is to patch vulnerable code. ONLY return the complete modified file content with no markdown formatting, no explanations, no wrapping code blocks.'
    },
    {
      role: 'user',
      content: `The previous patch for CVE ${cveId} (CWE: ${cweType}) failed regression tests. 

Here is the previous patch (${language}, ${ecosystem}):
${previousPatch}

Here is the test failure output:
${stderrOutput}

Please provide a corrected version of the code that resolves the test failures while maintaining the security patch. Remember, return ONLY the raw code.`
    }
  ];
}
