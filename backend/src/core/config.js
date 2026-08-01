import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '../../');

dotenv.config({ path: path.join(backendRoot, '.env') });

const config = {
  PORT: process.env.PORT || 3001,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '5', 10),
  TEST_TIMEOUT_MS: parseInt(process.env.TEST_TIMEOUT_MS || '30000', 10),
  MAX_MEMORY_MB: parseInt(process.env.MAX_MEMORY_MB || '512', 10),
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  LLM: {
    GROQ: {
      API_KEY: process.env.GROQ_API_KEY,
      MODEL: process.env.GROQ_MODEL || 'qwen-2.5-coder-32b',
      ENDPOINT: 'https://api.groq.com/openai/v1/chat/completions',
    },
    CEREBRAS: {
      API_KEY: process.env.CEREBRAS_API_KEY,
      MODEL: process.env.CEREBRAS_MODEL || 'llama-3.3-70b',
      ENDPOINT: 'https://api.cerebras.ai/v1/chat/completions',
    },
    GEMINI: {
      API_KEY: process.env.GEMINI_API_KEY,
      MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models',
    }
  }
};

const requiredVars = ['GITHUB_TOKEN'];
for (const v of requiredVars) {
  if (!process.env[v]) {
    console.warn(`WARNING: Missing required environment variable ${v}`);
  }
}

export default Object.freeze(config);
