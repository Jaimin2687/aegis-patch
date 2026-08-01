/**
 * Failover Pipeline Tests
 *
 * Validates the 4-tier failover order:
 *   1. Groq-Qwen  →  2. Groq-Llama  →  3. Cerebras  →  4. Gemini
 *
 * We mock every provider's `generate` method at the class level so no
 * real HTTP calls are made.  The tests exercise the exact branching
 * logic inside FailoverPipeline.generate().
 */

import { jest } from '@jest/globals';

// ─── Mock the three provider modules BEFORE importing the pipeline ───
// Jest's ESM mock support requires `jest.unstable_mockModule`.

const mockGroqGenerate = jest.fn();
const mockCerebrasGenerate = jest.fn();
const mockGeminiGenerate = jest.fn();

jest.unstable_mockModule('../src/llm/providers/groq.js', () => {
  class RateLimitError extends Error {
    constructor(provider, retryAfter) {
      super(`Rate limit hit on ${provider}`);
      this.name = 'RateLimitError';
      this.provider = provider;
      this.retryAfter = retryAfter;
    }
  }
  class ProviderError extends Error {
    constructor(provider, statusCode, message) {
      super(`${provider} error (${statusCode}): ${message}`);
      this.name = 'ProviderError';
      this.provider = provider;
      this.statusCode = statusCode;
    }
  }
  class GroqProvider {
    constructor(opts) { this.opts = opts; }
    generate(messages) { return mockGroqGenerate(this.opts.model, messages); }
  }
  return { GroqProvider, RateLimitError, ProviderError };
});

jest.unstable_mockModule('../src/llm/providers/cerebras.js', () => {
  class CerebrasProvider {
    constructor(opts) { this.opts = opts; }
    generate(messages) { return mockCerebrasGenerate(messages); }
  }
  return { CerebrasProvider };
});

jest.unstable_mockModule('../src/llm/providers/gemini.js', () => {
  class GeminiProvider {
    constructor(opts) { this.opts = opts; }
    generate(messages) { return mockGeminiGenerate(messages); }
  }
  return { GeminiProvider };
});

// Mock config so all providers are enabled
jest.unstable_mockModule('../src/core/config.js', () => ({
  default: {
    LLM: {
      GROQ: { API_KEY: 'test-groq-key', MODEL: 'qwen-2.5-coder-32b', ENDPOINT: 'http://fake' },
      CEREBRAS: { API_KEY: 'test-cerebras-key', MODEL: 'llama-3.3-70b', ENDPOINT: 'http://fake' },
      GEMINI: { API_KEY: 'test-gemini-key', MODEL: 'gemini-2.5-flash' },
    },
  },
}));

// Mock eventBus (logger depends on it)
jest.unstable_mockModule('../src/core/eventBus.js', () => ({
  default: {
    emit: jest.fn(),
    on: jest.fn(),
    emitLog: jest.fn(),
    emitEvent: jest.fn(),
  },
}));

// ─── Now dynamically import the pipeline (after mocks are registered) ──
const { FailoverPipeline } = await import('../src/llm/failoverPipeline.js');
const { RateLimitError } = await import('../src/llm/providers/groq.js');

// ─── Helpers ────────────────────────────────────────────────────────────
const MESSAGES = [{ role: 'user', content: 'patch this' }];

function makeSuccess(text = 'diff --git a/file.js') {
  return { content: text, tokensUsed: 42, latencyMs: 100 };
}

function makeProviderError(msg = 'server error') {
  return new Error(msg);
}

function makeRateLimitError(provider = 'groq') {
  return new RateLimitError(provider, 60);
}

// ─── Tests ──────────────────────────────────────────────────────────────
describe('FailoverPipeline', () => {
  let pipeline;

  beforeEach(() => {
    jest.clearAllMocks();
    pipeline = new FailoverPipeline('test-session-id');
  });

  // Sanity: constructor wired all 4 tiers
  test('constructor registers providers in Groq-Qwen → Groq-Llama → Cerebras → Gemini order', () => {
    const names = pipeline.providers.map(p => p.name);
    expect(names).toEqual(['groq-qwen', 'groq-llama', 'cerebras', 'gemini']);
  });

  // ── Scenario 1: primary succeeds, no fallback ──
  test('returns on first provider when Groq-Qwen succeeds', async () => {
    mockGroqGenerate.mockResolvedValueOnce(makeSuccess('patch from qwen'));

    const result = await pipeline.generate(MESSAGES);

    expect(result.provider).toBe('groq-qwen');
    expect(result.content).toBe('patch from qwen');
    expect(result.attempts).toBe(1);

    // Other providers should never be called
    expect(mockCerebrasGenerate).not.toHaveBeenCalled();
    expect(mockGeminiGenerate).not.toHaveBeenCalled();
  });

  // ── Scenario 2: primary 429s/fails, falls to Groq-Llama ──
  test('falls through to Groq-Llama when Groq-Qwen hits rate limit', async () => {
    mockGroqGenerate
      .mockRejectedValueOnce(makeRateLimitError('groq'))   // qwen → 429
      .mockResolvedValueOnce(makeSuccess('patch from llama')); // llama → ok

    const result = await pipeline.generate(MESSAGES);

    expect(result.provider).toBe('groq-llama');
    expect(result.content).toBe('patch from llama');
    expect(mockCerebrasGenerate).not.toHaveBeenCalled();
    expect(mockGeminiGenerate).not.toHaveBeenCalled();
  });

  test('falls through to Groq-Llama when Groq-Qwen throws generic error (after retry)', async () => {
    // The pipeline retries once within a provider (providerRetries = 1)
    mockGroqGenerate
      .mockRejectedValueOnce(makeProviderError('qwen boom'))   // qwen attempt 1
      .mockRejectedValueOnce(makeProviderError('qwen boom 2')) // qwen retry
      .mockResolvedValueOnce(makeSuccess('patch from llama')); // llama → ok

    const result = await pipeline.generate(MESSAGES);

    expect(result.provider).toBe('groq-llama');
    expect(result.content).toBe('patch from llama');
  });

  // ── Scenario 3: first two fail, falls to Cerebras ──
  test('falls through to Cerebras when both Groq providers fail', async () => {
    mockGroqGenerate
      .mockRejectedValueOnce(makeRateLimitError('groq'))      // qwen → 429
      .mockRejectedValueOnce(makeRateLimitError('groq'));      // llama → 429

    mockCerebrasGenerate.mockResolvedValueOnce(makeSuccess('patch from cerebras'));

    const result = await pipeline.generate(MESSAGES);

    expect(result.provider).toBe('cerebras');
    expect(result.content).toBe('patch from cerebras');
    expect(mockGeminiGenerate).not.toHaveBeenCalled();
  });

  // ── Scenario 4: all three fail, falls to Gemini ──
  test('falls through to Gemini when Groq + Cerebras all fail', async () => {
    mockGroqGenerate
      .mockRejectedValueOnce(makeRateLimitError('groq'))      // qwen → 429
      .mockRejectedValueOnce(makeRateLimitError('groq'));      // llama → 429

    mockCerebrasGenerate
      .mockRejectedValueOnce(makeProviderError('cerebras down'))  // attempt 1
      .mockRejectedValueOnce(makeProviderError('cerebras down')); // retry

    mockGeminiGenerate.mockResolvedValueOnce(makeSuccess('patch from gemini'));

    const result = await pipeline.generate(MESSAGES);

    expect(result.provider).toBe('gemini');
    expect(result.content).toBe('patch from gemini');
  });

  // ── Scenario 5: all four fail → pipeline reports failure (no silent crash) ──
  test('throws descriptive error when every provider fails', async () => {
    mockGroqGenerate
      .mockRejectedValueOnce(makeRateLimitError('groq'))      // qwen → 429
      .mockRejectedValueOnce(makeRateLimitError('groq'));      // llama → 429

    mockCerebrasGenerate
      .mockRejectedValueOnce(makeProviderError('cerebras dead'))
      .mockRejectedValueOnce(makeProviderError('cerebras dead'));

    mockGeminiGenerate
      .mockRejectedValueOnce(makeProviderError('gemini dead'))
      .mockRejectedValueOnce(makeProviderError('gemini dead'));

    await expect(pipeline.generate(MESSAGES))
      .rejects
      .toThrow('All LLM providers failed to generate patch');
  });

  // ── Edge: RateLimitError skips retry, generic error retries once ──
  test('rate limit skips provider immediately (no retry), generic error retries once', async () => {
    // Qwen: rate limit → immediate skip (1 call)
    // Llama: generic error × 2 (retry once) → skip
    // Cerebras: rate limit → immediate skip (1 call)
    // Gemini: succeeds
    mockGroqGenerate
      .mockRejectedValueOnce(makeRateLimitError('groq'))   // qwen — skip
      .mockRejectedValueOnce(makeProviderError('llama 1'))  // llama attempt 1
      .mockRejectedValueOnce(makeProviderError('llama 2')); // llama retry

    mockCerebrasGenerate
      .mockRejectedValueOnce(makeRateLimitError('cerebras'));

    mockGeminiGenerate
      .mockResolvedValueOnce(makeSuccess('gemini saves the day'));

    const result = await pipeline.generate(MESSAGES);

    expect(result.provider).toBe('gemini');
    // qwen(1) + llama(2) + cerebras(1) + gemini(1) = 5 total attempts
    expect(result.attempts).toBe(5);

    // Verify call counts
    expect(mockGroqGenerate).toHaveBeenCalledTimes(3);  // 1 qwen + 2 llama
    expect(mockCerebrasGenerate).toHaveBeenCalledTimes(1);
    expect(mockGeminiGenerate).toHaveBeenCalledTimes(1);
  });

  // ── Content: markdown fences are stripped from output ──
  test('strips markdown code fences from provider output', async () => {
    mockGroqGenerate.mockResolvedValueOnce(
      makeSuccess('```diff\n--- a/file.js\n+++ b/file.js\n```')
    );

    const result = await pipeline.generate(MESSAGES);

    expect(result.content).toBe('--- a/file.js\n+++ b/file.js');
  });
});
