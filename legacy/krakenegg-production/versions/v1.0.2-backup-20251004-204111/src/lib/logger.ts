export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

class Logger {
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor() {
    const envLevel = localStorage.getItem('KRAKENEGG_LOG_LEVEL') || 'info';
    this.setLogLevel(envLevel);
  }

  setLogLevel(level: string | LogLevel) {
    if (typeof level === 'string') {
      switch (level.toLowerCase()) {
        case 'trace': this.logLevel = LogLevel.TRACE; break;
        case 'debug': this.logLevel = LogLevel.DEBUG; break;
        case 'info': this.logLevel = LogLevel.INFO; break;
        case 'warn': this.logLevel = LogLevel.WARN; break;
        case 'error': this.logLevel = LogLevel.ERROR; break;
        default: this.logLevel = LogLevel.INFO;
      }
    } else {
      this.logLevel = level;
    }
    localStorage.setItem('KRAKENEGG_LOG_LEVEL', LogLevel[this.logLevel].toLowerCase());
  }

  private log(level: LogLevel, category: string, message: string, data?: any) {
    if (level < this.logLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with colors and emojis
    const levelString = LogLevel[level];
    const emoji = this.getLevelEmoji(level);
    const color = this.getLevelColor(level);

    const logMessage = `${emoji} [${category}] ${message}`;

    if (data !== undefined) {
      console.log(`%c${logMessage}`, `color: ${color}`, data);
    } else {
      console.log(`%c${logMessage}`, `color: ${color}`);
    }
  }

  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.TRACE: return '🔍';
      case LogLevel.DEBUG: return '🐛';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '❌';
      default: return 'ℹ️';
    }
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.TRACE: return '#888';
      case LogLevel.DEBUG: return '#0066cc';
      case LogLevel.INFO: return '#009900';
      case LogLevel.WARN: return '#ff6600';
      case LogLevel.ERROR: return '#cc0000';
      default: return '#000';
    }
  }

  trace(category: string, message: string, data?: any) {
    this.log(LogLevel.TRACE, category, message, data);
  }

  debug(category: string, message: string, data?: any) {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  info(category: string, message: string, data?: any) {
    this.log(LogLevel.INFO, category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.log(LogLevel.WARN, category, message, data);
  }

  error(category: string, message: string, data?: any) {
    this.log(LogLevel.ERROR, category, message, data);
  }

  // Special methods for common categories
  fileSystem(message: string, data?: any) {
    this.info('FILE_SYSTEM', message, data);
  }

  navigation(message: string, data?: any) {
    this.info('NAVIGATION', message, data);
  }

  tauri(message: string, data?: any) {
    this.debug('TAURI', message, data);
  }

  ui(message: string, data?: any) {
    this.debug('UI', message, data);
  }

  performance(operation: string, duration: number) {
    if (duration > 500) {
      this.warn('PERFORMANCE', `${operation} took ${duration}ms (slow)`);
    } else {
      this.debug('PERFORMANCE', `${operation} took ${duration}ms`);
    }
  }

  // Get logs for debugging
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Export logs to file
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
  }
}

// Global logger instance
export const logger = new Logger();

// Utility function for timing operations
export function logTiming<T>(operation: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  logger.performance(operation, Math.round(duration));
  return result;
}

// Utility function for timing async operations
export async function logTimingAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  logger.performance(operation, Math.round(duration));
  return result;
}