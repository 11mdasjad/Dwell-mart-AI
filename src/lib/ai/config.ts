// ===========================================
// AI Agent Configuration
// ===========================================

export interface AgentConfig {
  provider: 'gemini' | 'openai' | 'mock';
  mockMode: boolean;
  openaiApiKey?: string;
  geminiApiKey?: string;
  model: string;
  timeoutMs: number;
  maxTokens: number;
  temperature: number;
}

export function getAgentConfig(): AgentConfig {
  const explicitMockMode = process.env.AI_MOCK_MODE === 'true';
  const providerEnv = (process.env.AI_PROVIDER || '').toLowerCase();
  const openaiApiKey = process.env.OPENAI_API_KEY?.trim();
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();

  const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS || '30000', 10);
  const maxTokens = parseInt(process.env.AI_MAX_TOKENS || '1024', 10);
  const temperature = parseFloat(process.env.AI_TEMPERATURE || '0.7');

  // Determine active provider
  let targetProvider: 'gemini' | 'openai' | 'mock' = 'mock';

  if (explicitMockMode || providerEnv === 'mock') {
    targetProvider = 'mock';
  } else if (providerEnv === 'gemini' || providerEnv === 'google') {
    targetProvider = geminiApiKey ? 'gemini' : 'mock';
  } else if (providerEnv === 'openai') {
    targetProvider = openaiApiKey ? 'openai' : 'mock';
  } else if (geminiApiKey) {
    targetProvider = 'gemini';
  } else if (openaiApiKey) {
    targetProvider = 'openai';
  }

  const mockMode = explicitMockMode || targetProvider === 'mock';

  let model = process.env.AI_MODEL || '';
  if (!model) {
    if (targetProvider === 'gemini') {
      model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    } else if (targetProvider === 'openai') {
      model = process.env.OPENAI_MODEL || 'gpt-4o';
    } else {
      model = 'offline-simulator';
    }
  }

  return {
    provider: targetProvider,
    mockMode,
    openaiApiKey,
    geminiApiKey,
    model,
    timeoutMs: Number.isNaN(timeoutMs) ? 30000 : timeoutMs,
    maxTokens: Number.isNaN(maxTokens) ? 1024 : maxTokens,
    temperature: Number.isNaN(temperature) ? 0.7 : temperature,
  };
}

export function isMockModeActive(): boolean {
  return getAgentConfig().mockMode;
}

/**
 * Returns safe agent settings for diagnostics/UI without sensitive secrets
 */
export function getSafeAgentConfig() {
  const config = getAgentConfig();
  const hasApiKey = config.provider === 'gemini' ? Boolean(config.geminiApiKey) : Boolean(config.openaiApiKey);

  return {
    provider: config.provider,
    mockMode: config.mockMode,
    model: config.model,
    hasApiKey,
    timeoutMs: config.timeoutMs,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
  };
}

