export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  traceId?: string;
  spanId?: string;
  callerId?: string;
  clientType?: string;
  storyId?: string;
  toolName?: string;
  [key: string]: unknown;
}

export interface StructuredLogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class StructuredLogger {
  private baseContext: LogContext;
  private minLevel: LogLevel;
  private logs: StructuredLogEntry[] = [];

  private static levelOrder: Record<LogLevel, number> = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
  };

  constructor(baseContext: LogContext = {}, minLevel: LogLevel = 'info') {
    this.baseContext = baseContext;
    this.minLevel = minLevel;
  }

  public child(childContext: LogContext): StructuredLogger {
    const logger = new StructuredLogger(
      { ...this.baseContext, ...childContext },
      this.minLevel
    );
    return logger;
  }

  public setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  public getInMemoryLogs(): StructuredLogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  private shouldLog(level: LogLevel): boolean {
    return (
      StructuredLogger.levelOrder[level] >=
      StructuredLogger.levelOrder[this.minLevel]
    );
  }

  private formatEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    err?: Error
  ): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.baseContext, ...context },
    };

    if (err) {
      entry.error = {
        name: err.name,
        message: err.message,
        stack: err.stack,
      };
    }

    return entry;
  }

  private emit(entry: StructuredLogEntry): void {
    this.logs.push(entry);
    const jsonStr = JSON.stringify(entry);

    switch (entry.level) {
      case 'error':
        console.error(jsonStr);
        break;
      case 'warn':
        console.warn(jsonStr);
        break;
      case 'debug':
      case 'trace':
        console.debug(jsonStr);
        break;
      default:
        console.log(jsonStr);
        break;
    }
  }

  public info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      this.emit(this.formatEntry('info', message, context));
    }
  }

  public warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      this.emit(this.formatEntry('warn', message, context));
    }
  }

  public error(message: string, err?: Error, context?: LogContext): void {
    if (this.shouldLog('error')) {
      this.emit(this.formatEntry('error', message, context, err));
    }
  }

  public debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      this.emit(this.formatEntry('debug', message, context));
    }
  }

  public trace(message: string, context?: LogContext): void {
    if (this.shouldLog('trace')) {
      this.emit(this.formatEntry('trace', message, context));
    }
  }
}

export const logger = new StructuredLogger();
