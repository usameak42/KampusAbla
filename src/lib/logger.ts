/* eslint-disable no-console */
import * as Sentry from "@sentry/react";
import { supabase } from "@/integrations/supabase/client";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  userId?: string;
  action?: string;
  error?: unknown;
  [key: string]: unknown;
}

interface LogEvent {
  timestamp: string;
  level: LogLevel;
  action: string;
  user_id: string | null;
  message: string;
  context?: Record<string, unknown>;
}

let cachedUserId: string | null | undefined;
let consoleGuardsInstalled = false;

const originalConsole = {
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

async function resolveUserId(explicitUserId?: string): Promise<string | null> {
  if (explicitUserId) return explicitUserId;
  if (cachedUserId !== undefined) return cachedUserId;

  try {
    const { data } = await supabase.auth.getUser();
    cachedUserId = data.user?.id ?? null;
    return cachedUserId;
  } catch {
    cachedUserId = null;
    return null;
  }
}

function writeConsole(level: LogLevel, event: LogEvent) {
  const payload = JSON.stringify(event);

  if (level === "debug") {
    originalConsole.debug(payload);
    return;
  }
  if (level === "info") {
    originalConsole.info(payload);
    return;
  }
  if (level === "warn") {
    originalConsole.warn(payload);
    return;
  }
  originalConsole.error(payload);
}

async function writeAuditLog(level: LogLevel, event: LogEvent) {
  if (level !== "info" && level !== "warn") return;
  if (!event.user_id) return;

  await supabase.from("audit_logs" as any).insert({
    user_id: event.user_id,
    action: event.action,
    details: {
      level: event.level,
      message: event.message,
      timestamp: event.timestamp,
      context: event.context ?? {},
    },
  } as any);
}

function writeSentry(level: LogLevel, event: LogEvent, error?: unknown) {
  if (level !== "error") return;

  const extras: Record<string, unknown> = { ...event };

  if (error instanceof Error) {
    Sentry.captureException(error, {
      tags: { action: event.action, source: "logger" },
      extra: extras,
    });
    return;
  }

  Sentry.captureMessage(event.message, {
    level: "error",
    tags: { action: event.action, source: "logger" },
    extra: extras,
  });
}

async function log(level: LogLevel, message: string, context: LogContext = {}) {
  const userId = await resolveUserId(context.userId);
  const action = context.action ?? "app.log";
  const { action: _action, userId: _userId, error, ...rest } = context;

  const event: LogEvent = {
    timestamp: new Date().toISOString(),
    level,
    action,
    user_id: userId,
    message,
    context: Object.keys(rest).length > 0 ? rest : undefined,
  };

  writeConsole(level, event);
  writeSentry(level, event, error);

  try {
    await writeAuditLog(level, event);
  } catch {
    // Keep logging non-blocking for user flows.
  }
}

export function installProductionConsoleGuards() {
  if (!import.meta.env.PROD || consoleGuardsInstalled) return;

  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  consoleGuardsInstalled = true;
}

export const logger = {
  debug: (message: string, context?: LogContext) => {
    void log("debug", message, context);
  },
  info: (message: string, context?: LogContext) => {
    void log("info", message, context);
  },
  warn: (message: string, context?: LogContext) => {
    void log("warn", message, context);
  },
  error: (message: string, context?: LogContext) => {
    void log("error", message, context);
  },
};
