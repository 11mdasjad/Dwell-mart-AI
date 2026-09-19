// ===========================================
// AI Module Public Exports
// ===========================================

export {
  processAgentChat,
  resolveAIProvider,
  resolveAIProvider as getAIProvider,
  processAgentChat as processMessage,
} from './orchestrator';

export {
  getAgentConfig,
  isMockModeActive,
  isMockModeActive as isMockMode,
  getSafeAgentConfig,
} from './config';

export { toolRegistry } from './tools/registry';
export { TOOL_DEFINITIONS } from './tool-definitions';
export { executeTool } from './tool-executor';
export { SYSTEM_PROMPT, MOCK_MODE_ADDENDUM } from './system-prompt';
export { MockAIProvider } from './mock-provider';
export { OpenAIProvider } from './openai-provider';
export { GeminiProvider } from './gemini-provider';
export {
  AIError,
  AuthenticationError,
  RateLimitError,
  TimeoutError,
  MalformedResponseError,
  ProviderUnavailableError,
  ToolExecutionError,
} from './errors';
