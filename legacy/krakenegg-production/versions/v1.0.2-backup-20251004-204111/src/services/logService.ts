/**
 * Comprehensive Logging Service for KrakenEgg
 * Captures all user interactions and system operations for debugging
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  USER_ACTION = 'USER_ACTION',
  SYSTEM = 'SYSTEM'
}

export enum LogCategory {
  FILE_OPERATION = 'FILE_OPERATION',
  NAVIGATION = 'NAVIGATION',
  UI_INTERACTION = 'UI_INTERACTION',
  BACKEND_COMMAND = 'BACKEND_COMMAND',
  ERROR_HANDLING = 'ERROR_HANDLING',
  PERFORMANCE = 'PERFORMANCE',
  TEST_FRAMEWORK = 'TEST_FRAMEWORK'
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  sessionId: string;
  userId?: string;
  context?: {
    component?: string;
    function?: string;
    path?: string;
    operation?: string;
    duration?: number;
    success?: boolean;
  };
}

export interface LogSession {
  sessionId: string;
  startTime: string;
  endTime?: string;
  userAgent: string;
  platform: string;
  totalOperations: number;
  errorCount: number;
  lastActivity: string;
}

class LogService {
  private logs: LogEntry[] = [];
  private currentSession: LogSession;
  private maxLogs = 10000; // Keep last 10k logs in memory
  private enabledCategories: Set<LogCategory> = new Set(Object.values(LogCategory));
  private enabledLevels: Set<LogLevel> = new Set(Object.values(LogLevel));

  constructor() {
    this.currentSession = this.createNewSession();
    this.setupPerformanceMonitoring();
    this.log(LogLevel.SYSTEM, LogCategory.UI_INTERACTION, 'LogService initialized', {
      sessionId: this.currentSession.sessionId,
      platform: navigator.platform,
      userAgent: navigator.userAgent
    });
  }

  private createNewSession(): LogSession {
    return {
      sessionId: this.generateId(),
      startTime: new Date().toISOString(),
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      totalOperations: 0,
      errorCount: 0,
      lastActivity: new Date().toISOString()
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupPerformanceMonitoring() {
    // Monitor performance for long operations
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const start = performance.now();
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;

        if (duration > 1000) { // Log slow requests
          this.log(LogLevel.WARN, LogCategory.PERFORMANCE, 'Slow network request detected', {
            url: args[0],
            duration: Math.round(duration),
            status: response.status
          });
        }

        return response;
      } catch (error) {
        const duration = performance.now() - start;
        this.log(LogLevel.ERROR, LogCategory.PERFORMANCE, 'Network request failed', {
          url: args[0],
          duration: Math.round(duration),
          error: error instanceof Error ? error.message : String(error)
        });
        throw error;
      }
    };
  }

  public log(level: LogLevel, category: LogCategory, message: string, data?: any, context?: LogEntry['context']): void {
    if (!this.enabledLevels.has(level) || !this.enabledCategories.has(category)) {
      return;
    }

    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      sessionId: this.currentSession.sessionId,
      context
    };

    this.logs.push(entry);
    this.currentSession.totalOperations++;
    this.currentSession.lastActivity = entry.timestamp;

    if (level === LogLevel.ERROR) {
      this.currentSession.errorCount++;
    }

    // Maintain log size limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output for development
    this.outputToConsole(entry);

    // Emit event for real-time monitoring
    window.dispatchEvent(new CustomEvent('kraken-log', { detail: entry }));
  }

  private outputToConsole(entry: LogEntry): void {
    const prefix = `🦑 [${entry.level}][${entry.category}]`;
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const message = `${prefix} ${timestamp} - ${entry.message}`;

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(message, entry.data, entry.context);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data, entry.context);
        break;
      case LogLevel.DEBUG:
        console.debug(message, entry.data, entry.context);
        break;
      case LogLevel.USER_ACTION:
        console.info(`🎮 ${message}`, entry.data, entry.context);
        break;
      case LogLevel.SYSTEM:
        console.info(`⚙️ ${message}`, entry.data, entry.context);
        break;
      default:
        console.log(message, entry.data, entry.context);
    }
  }

  // Convenience methods for different log types
  public logUserAction(message: string, data?: any, context?: LogEntry['context']): void {
    this.log(LogLevel.USER_ACTION, LogCategory.UI_INTERACTION, message, data, context);
  }

  public logFileOperation(operation: string, path?: string, success?: boolean, data?: any): void {
    this.log(
      success ? LogLevel.INFO : LogLevel.ERROR,
      LogCategory.FILE_OPERATION,
      `File operation: ${operation}`,
      data,
      { operation, path, success }
    );
  }

  public logNavigation(from: string, to: string, success: boolean = true): void {
    this.log(
      success ? LogLevel.INFO : LogLevel.ERROR,
      LogCategory.NAVIGATION,
      `Navigation: ${from} → ${to}`,
      { from, to },
      { operation: 'navigate', success }
    );
  }

  public logBackendCommand(command: string, params?: any, duration?: number, success?: boolean): void {
    this.log(
      success ? LogLevel.INFO : LogLevel.ERROR,
      LogCategory.BACKEND_COMMAND,
      `Backend command: ${command}`,
      params,
      { operation: command, duration, success }
    );
  }

  public logError(error: Error | string, context?: LogEntry['context'], category: LogCategory = LogCategory.ERROR_HANDLING): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : { message: error };

    this.log(LogLevel.ERROR, category, `Error: ${errorMessage}`, errorData, context);
  }

  public logPerformance(operation: string, duration: number, context?: LogEntry['context']): void {
    const level = duration > 5000 ? LogLevel.WARN : duration > 1000 ? LogLevel.INFO : LogLevel.DEBUG;
    this.log(level, LogCategory.PERFORMANCE, `Performance: ${operation} took ${duration}ms`, {
      operation,
      duration
    }, context);
  }

  // Retrieval and filtering methods
  public getLogs(filter?: {
    levels?: LogLevel[];
    categories?: LogCategory[];
    since?: Date;
    limit?: number;
    search?: string;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.levels) {
        filteredLogs = filteredLogs.filter(log => filter.levels!.includes(log.level));
      }

      if (filter.categories) {
        filteredLogs = filteredLogs.filter(log => filter.categories!.includes(log.category));
      }

      if (filter.since) {
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= filter.since!);
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log =>
          log.message.toLowerCase().includes(searchLower) ||
          JSON.stringify(log.data || {}).toLowerCase().includes(searchLower)
        );
      }

      if (filter.limit) {
        filteredLogs = filteredLogs.slice(-filter.limit);
      }
    }

    return filteredLogs;
  }

  public getSession(): LogSession {
    return { ...this.currentSession };
  }

  public exportLogs(format: 'json' | 'csv' | 'txt' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify({
          session: this.currentSession,
          logs: this.logs
        }, null, 2);

      case 'csv':
        const headers = 'Timestamp,Level,Category,Message,Data,Context\n';
        const rows = this.logs.map(log =>
          [
            log.timestamp,
            log.level,
            log.category,
            `"${log.message.replace(/"/g, '""')}"`,
            `"${JSON.stringify(log.data || {}).replace(/"/g, '""')}"`,
            `"${JSON.stringify(log.context || {}).replace(/"/g, '""')}"`
          ].join(',')
        ).join('\n');
        return headers + rows;

      case 'txt':
        return this.logs.map(log => {
          const timestamp = new Date(log.timestamp).toLocaleString();
          const context = log.context ? ` [${JSON.stringify(log.context)}]` : '';
          const data = log.data ? ` Data: ${JSON.stringify(log.data)}` : '';
          return `[${timestamp}] ${log.level} ${log.category}: ${log.message}${context}${data}`;
        }).join('\n');

      default:
        return this.exportLogs('json');
    }
  }

  public clearLogs(): void {
    this.logs = [];
    this.log(LogLevel.SYSTEM, LogCategory.UI_INTERACTION, 'Logs cleared');
  }

  public getStatistics(): {
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    sessionDuration: number;
    categoryCounts: Record<LogCategory, number>;
    levelCounts: Record<LogLevel, number>;
    recentErrorRate: number;
  } {
    const now = new Date();
    const sessionStart = new Date(this.currentSession.startTime);
    const sessionDuration = now.getTime() - sessionStart.getTime();

    const categoryCounts = {} as Record<LogCategory, number>;
    const levelCounts = {} as Record<LogLevel, number>;

    // Initialize counts
    Object.values(LogCategory).forEach(cat => categoryCounts[cat] = 0);
    Object.values(LogLevel).forEach(level => levelCounts[level] = 0);

    // Count logs
    this.logs.forEach(log => {
      categoryCounts[log.category]++;
      levelCounts[log.level]++;
    });

    // Calculate recent error rate (last 100 logs)
    const recentLogs = this.logs.slice(-100);
    const recentErrors = recentLogs.filter(log => log.level === LogLevel.ERROR).length;
    const recentErrorRate = recentLogs.length > 0 ? (recentErrors / recentLogs.length) * 100 : 0;

    return {
      totalLogs: this.logs.length,
      errorCount: levelCounts[LogLevel.ERROR],
      warningCount: levelCounts[LogLevel.WARN],
      sessionDuration,
      categoryCounts,
      levelCounts,
      recentErrorRate
    };
  }

  // Configuration methods
  public setEnabledCategories(categories: LogCategory[]): void {
    this.enabledCategories = new Set(categories);
    this.log(LogLevel.SYSTEM, LogCategory.UI_INTERACTION, 'Log categories updated', { categories });
  }

  public setEnabledLevels(levels: LogLevel[]): void {
    this.enabledLevels = new Set(levels);
    this.log(LogLevel.SYSTEM, LogCategory.UI_INTERACTION, 'Log levels updated', { levels });
  }

  public setMaxLogs(maxLogs: number): void {
    this.maxLogs = maxLogs;
    if (this.logs.length > maxLogs) {
      this.logs = this.logs.slice(-maxLogs);
    }
    this.log(LogLevel.SYSTEM, LogCategory.UI_INTERACTION, 'Max logs updated', { maxLogs });
  }
}

// Create singleton instance
const logService = new LogService();

// Global error handling
window.addEventListener('error', (event) => {
  logService.logError(event.error || event.message, {
    component: 'global',
    function: 'window.error',
    path: event.filename,
    operation: 'error_handling'
  });
});

window.addEventListener('unhandledrejection', (event) => {
  logService.logError(event.reason, {
    component: 'global',
    function: 'unhandledrejection',
    operation: 'error_handling'
  });
});

export { logService };
export default logService;