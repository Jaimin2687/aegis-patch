import { GroqProvider, RateLimitError } from './providers/groq.js';
import { CerebrasProvider } from './providers/cerebras.js';
import { GeminiProvider } from './providers/gemini.js';
import config from '../core/config.js';
import eventBus from '../core/eventBus.js';
import { createLogger } from '../utils/logger.js';

export class FailoverPipeline {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.logger = createLogger(sessionId);
    this.providers = [];

    if (config.LLM?.GROQ?.API_KEY) {
      this.providers.push({
        name: 'groq-qwen',
        provider: new GroqProvider({
          apiKey: config.LLM.GROQ.API_KEY,
          model: config.LLM.GROQ.MODEL || 'qwen-2.5-coder-32b',
          endpoint: config.LLM.GROQ.ENDPOINT
        })
      });
      this.providers.push({
        name: 'groq-llama',
        provider: new GroqProvider({
          apiKey: config.LLM.GROQ.API_KEY,
          model: 'llama-3.3-70b-versatile',
          endpoint: config.LLM.GROQ.ENDPOINT
        })
      });
    }

    if (config.LLM?.CEREBRAS?.API_KEY) {
      this.providers.push({
        name: 'cerebras',
        provider: new CerebrasProvider({
          apiKey: config.LLM.CEREBRAS.API_KEY,
          model: config.LLM.CEREBRAS.MODEL || 'llama-3.3-70b',
          endpoint: config.LLM.CEREBRAS.ENDPOINT
        })
      });
    }

    if (config.LLM?.GEMINI?.API_KEY) {
      this.providers.push({
        name: 'gemini',
        provider: new GeminiProvider({
          apiKey: config.LLM.GEMINI.API_KEY,
          model: config.LLM.GEMINI.MODEL || 'gemini-2.5-flash'
        })
      });
    }

    if (this.providers.length === 0) {
      this.logger.warn('PIPELINE', 'No LLM providers configured, patch synthesis will fail');
    }
  }

  /**
   * Tries to generate content using providers sequentially based on failover logic
   * @param {Array} messages - Chat messages array
   * @returns {Promise<Object>} Output content and metadata
   */
  async generate(messages) {
    let attempts = 0;
    
    for (let i = 0; i < this.providers.length; i++) {
      const { name, provider } = this.providers[i];
      let providerRetries = 1;
      
      while (providerRetries >= 0) {
        attempts++;
        try {
          this.logger.debug('PATCHING', `Attempting generation with ${name}`);
          const result = await provider.generate(messages);
          
          let content = result.content;
          // Strip markdown fences
          content = content.replace(/^```[a-z]*\n/i, '').replace(/\n```$/i, '').trim();

          return {
            content,
            provider: name,
            latencyMs: result.latencyMs,
            attempts
          };
        } catch (error) {
          if (error instanceof RateLimitError) {
            this.logger.warn('PATCHING', `Rate limit hit on ${name}, switching provider.`);
            break; // Switch to next provider immediately
          } else {
            this.logger.error('PATCHING', `${name} error: ${error.message}`);
            providerRetries--;
            if (providerRetries < 0) {
              this.logger.warn('PATCHING', `${name} failed, switching provider.`);
              break;
            }
          }
        }
      }
    }

    throw new Error('All LLM providers failed to generate patch');
  }
}
