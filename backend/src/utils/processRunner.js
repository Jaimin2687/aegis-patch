import { execFile } from 'child_process';
import config from '../core/config.js';

/**
 * Run a process using child_process.execFile safely
 * @param {string} command 
 * @param {string[]} args 
 * @param {Object} options 
 * @returns {Promise<{exitCode: number, stdout: string, stderr: string, timedOut: boolean}>}
 */
export async function runProcess(command, args = [], options = {}) {
  const timeoutMs = options.timeout || 30000;
  const maxBuffer = options.maxBuffer || 10 * 1024 * 1024;
  
  const env = { 
    ...process.env, 
    ...options.env,
    NODE_OPTIONS: `--max-old-space-size=${config.MAX_MEMORY_MB} ${process.env.NODE_OPTIONS || ''}`.trim()
  };

  return new Promise((resolve) => {
    let timedOut = false;
    let stdoutData = '';
    let stderrData = '';

    const child = execFile(command, args, { 
      cwd: options.cwd, 
      env, 
      maxBuffer 
    });

    child.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 5000);
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: code,
        stdout: stdoutData,
        stderr: stderrData,
        timedOut
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        exitCode: -1,
        stdout: stdoutData,
        stderr: stderrData + '\n' + err.message,
        timedOut: false
      });
    });
  });
}
