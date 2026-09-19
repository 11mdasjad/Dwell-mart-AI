// ===========================================
// Safe Logger — Defensive, Redacted Logging
// ===========================================

type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  clientIp?: string;
  event?: string;
  statusCode?: number;
  durationMs?: number;
  messageCount?: number;
  toolName?: string;
  mockMode?: boolean;
  errorCode?: string;
  [key: string]: unknown;
}

// Redact known sensitive keys
const SENSITIVE_KEYS = new Set([
  'authorization',
  'api_key',
  'apikey',
  'password',
  'secret',
  'token',
  'openai_api_key',
  'cookie',
]);

function sanitizeMetadata(meta: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lower) || lower.includes('key') || lower.includes('secret') || lower.includes('auth')) {
      clean[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      clean[key] = value;
    }
  }

  return clean;
}

function maskIp(ip: string): string {
  if (!ip || ip === 'anonymous' || ip === 'unknown') return 'anonymous';
  if (ip.includes('.')) {
    const parts = ip.split('.');
    return parts.length === 4 ? `${parts[0]}.${parts[1]}.*.*` : 'masked-ipv4';
  }
  return ip.substring(0, 8) + '...';
}

function logMessage(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const safeContext = context ? sanitizeMetadata(context as Record<string, unknown>) : {};

  if (safeContext.clientIp && typeof safeContext.clientIp === 'string') {
    safeContext.clientIp = maskIp(safeContext.clientIp);
  }

  const payload = {
    timestamp,
    level,
    message,
    ...safeContext,
  };

  const output = JSON.stringify(payload);

  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  info: (message: string, context?: LogContext) => logMessage('info', message, context),
  warn: (message: string, context?: LogContext) => logMessage('warn', message, context),
  error: (message: string, context?: LogContext) => logMessage('error', message, context),
};
