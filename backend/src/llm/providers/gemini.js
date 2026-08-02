import { request } from 'undici';
import { RateLimitError, ProviderError } from './groq.js';

export class GeminiProvider {
  constructor({ apiKey, model = 'gemini-2.5-flash' }) {
    this.name = 'gemini';
    this.apiKey = apiKey;
    this.model = model;
    this.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
  }

  /**
   * Generates a completion from Gemini REST API
   * @param {Array} messages - Chat messages array
   * @returns {Promise<Object>} Output content and metadata
   */
  async generate(messages) {
    const start = Date.now();
    
    const systemMessage = messages.find(m => m.role === 'system')?.content;
    const geminiMessages = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const payload = {
      contents: geminiMessages,
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096
      }
    };
    
    if (systemMessage) {
      payload.systemInstruction = {
        parts: [{ text: systemMessage }]
      };
    }

    const { statusCode, headers, body } = await request(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await body.text();
    const latencyMs = Date.now() - start;

    if (statusCode === 429) {
      throw new RateLimitError(this.name, 60);
    }

    if (statusCode !== 200) {
      throw new ProviderError(this.name, statusCode, responseText.slice(0, 200));
    }

    const data = JSON.parse(responseText);
    if (!data.candidates?.length || !data.candidates[0].content?.parts?.[0]?.text) {
      throw new ProviderError(this.name, 500, 'Empty response from Gemini');
    }
    return {
      content: data.candidates[0].content.parts[0].text,
      tokensUsed: data.usageMetadata?.totalTokenCount || 0,
      latencyMs
    };
  }
}
