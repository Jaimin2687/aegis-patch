import { request } from 'undici';
import { RateLimitError, ProviderError } from './groq.js';

export class CerebrasProvider {
  constructor({ apiKey, model = 'llama-3.3-70b', endpoint = 'https://api.cerebras.ai/v1/chat/completions' }) {
    this.name = 'cerebras';
    this.apiKey = apiKey;
    this.model = model;
    this.endpoint = endpoint;
  }

  /**
   * Generates a completion from Cerebras API
   * @param {Array} messages - Chat messages array
   * @returns {Promise<Object>} Output content and metadata
   */
  async generate(messages) {
    const start = Date.now();
    const { statusCode, headers, body } = await request(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.1,
        max_tokens: 4096
      })
    });

    const responseText = await body.text();
    const latencyMs = Date.now() - start;

    if (statusCode === 429) {
      const retryAfter = headers['retry-after'] ? parseInt(headers['retry-after'], 10) : 60;
      throw new RateLimitError(this.name, retryAfter);
    }

    if (statusCode !== 200) {
      throw new ProviderError(this.name, statusCode, responseText.slice(0, 200));
    }

    const data = JSON.parse(responseText);
    return {
      content: data.choices[0].message.content,
      tokensUsed: data.usage?.total_tokens || 0,
      latencyMs
    };
  }
}
