// ===========================================
// Controlled Tool Registry & Whitelist
// ===========================================
// Prevents arbitrary tool execution and validates
// function arguments through strict Zod schemas.
// ===========================================

import { ToolCall, ToolCallResult, ToolDefinition } from '@/types/chat';
import { TOOL_DEFINITIONS } from '../tool-definitions';
import { executeTool as executeToolHandler } from '../tool-executor';
import { ToolExecutionError } from '../errors';
import { logger } from '@/lib/logger';

export type ToolExecutorFunction = (args: Record<string, unknown>) => Promise<unknown>;

export class ToolRegistry {
  private allowedTools = new Set<string>();
  private definitions = new Map<string, ToolDefinition>();

  constructor() {
    for (const def of TOOL_DEFINITIONS) {
      this.allowedTools.add(def.name);
      this.definitions.set(def.name, def);
    }
  }

  /**
   * Check if a tool is registered in the whitelist
   */
  public hasTool(name: string): boolean {
    return this.allowedTools.has(name);
  }

  /**
   * Get all whitelisted tool definitions for the AI provider
   */
  public getDefinitions(): ToolDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Get definition for a single tool
   */
  public getDefinition(name: string): ToolDefinition | undefined {
    return this.definitions.get(name);
  }

  /**
   * Execute a tool call safely with validation and defense against arbitrary tools
   */
  public async execute(toolCall: ToolCall): Promise<ToolCallResult> {
    const { name, arguments: args } = toolCall;

    if (!this.hasTool(name)) {
      logger.warn('Blocked attempt to execute unauthorized tool', {
        event: 'tool_blocked',
        toolName: name,
      });

      return {
        toolName: name,
        arguments: args || {},
        result: { error: `Unauthorized tool execution: '${name}' is not permitted.` },
        success: false,
        error: `Tool '${name}' is not authorized.`,
      };
    }

    try {
      logger.info('Executing authorized tool', {
        event: 'tool_exec_start',
        toolName: name,
      });

      const startTime = Date.now();
      const result = await executeToolHandler(toolCall);
      const durationMs = Date.now() - startTime;

      logger.info('Tool executed', {
        event: 'tool_exec_complete',
        toolName: name,
        durationMs,
        success: result.success,
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown tool error';
      logger.error('Tool execution exception', {
        event: 'tool_exec_error',
        toolName: name,
        error: message,
      });

      throw new ToolExecutionError(name, message);
    }
  }
}

export const toolRegistry = new ToolRegistry();
