/**
 * Comprehensive Debug Logging System for KrakenEgg Auto-Scroll Debugging
 *
 * This logger captures detailed information about:
 * - User input events (keyboard navigation)
 * - Virtual scroll state and calculations
 * - DOM scroll operations and measurements
 * - File list rendering and state changes
 * - Performance metrics and timing
 */

interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  category: string;
  message: string;
  data?: any;
  stackTrace?: string;
}

interface ScrollDebugData {
  // Virtual scroll state
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  scrollTop: number;
  visibleRange: { start: number; end: number };

  // Target item information
  targetIndex: number;
  targetItemTop: number;
  targetItemBottom: number;

  // Container measurements
  containerRect: DOMRect;
  visibleTop: number;
  visibleBottom: number;

  // Scroll calculation results
  bufferSize: number;
  needsScroll: boolean;
  scrollDirection?: 'up' | 'down';
  newScrollTop?: number;

  // Performance data
  renderTime?: number;
  scrollDuration?: number;
}

interface KeyboardEventData {
  key: string;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  currentIndex: number;
  newIndex: number;
  totalItems: number;
  navigationMode: 'single' | 'page' | 'home' | 'end';
}

interface FileListStateData {
  currentPath: string;
  fileCount: number;
  folderCount: number;
  selectedIndex: number;
  focusedIndex: number;
  visibleItemsCount: number;
  renderingMode: 'virtual' | 'standard';
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 entries
  private logToConsole = true;
  private logToFile = true;
  private sessionId: string;
  private startTime: number;

  constructor() {
    this.sessionId = `krakengg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.startTime = performance.now();
    this.info('SYSTEM', 'Debug logger initialized', { sessionId: this.sessionId });
  }

  private createLogEntry(
    level: LogEntry['level'],
    category: string,
    message: string,
    data?: any
  ): LogEntry {
    const now = new Date();
    const relativeTime = performance.now() - this.startTime;

    const entry: LogEntry = {
      timestamp: now.toISOString(),
      level,
      category,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined,
      stackTrace: level === 'ERROR' ? new Error().stack : undefined
    };

    // Add performance timing
    if (data) {
      (entry.data as any).relativeTime = Math.round(relativeTime * 100) / 100;
    } else {
      entry.data = { relativeTime: Math.round(relativeTime * 100) / 100 };
    }

    return entry;
  }

  private log(entry: LogEntry) {
    // Add to internal log buffer
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with styling
    if (this.logToConsole) {
      const style = this.getConsoleStyle(entry.level);
      const prefix = `[${entry.level}] ${entry.category}`;

      console.groupCollapsed(`%c${prefix}: ${entry.message}`, style);
      if (entry.data) {
        console.log('📊 Data:', entry.data);
      }
      if (entry.stackTrace && entry.level === 'ERROR') {
        console.log('📍 Stack:', entry.stackTrace);
      }
      console.groupEnd();
    }

    // File output (in development)
    if (this.logToFile && process.env.NODE_ENV === 'development') {
      this.writeToLogFile(entry);
    }
  }

  private getConsoleStyle(level: LogEntry['level']): string {
    const styles = {
      DEBUG: 'color: #888; font-weight: normal;',
      INFO: 'color: #2196F3; font-weight: bold;',
      WARN: 'color: #FF9800; font-weight: bold;',
      ERROR: 'color: #F44336; font-weight: bold; background: #FFEBEE; padding: 2px 4px;'
    };
    return styles[level];
  }

  private async writeToLogFile(entry: LogEntry) {
    try {
      // In a real implementation, this would write to a log file
      // For now, we'll use localStorage as a fallback
      const logKey = `krakenegg-debug-log-${this.sessionId}`;
      const existingLogs = localStorage.getItem(logKey);
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(entry);

      // Keep only last 500 entries in localStorage
      if (logs.length > 500) {
        logs.splice(0, logs.length - 500);
      }

      localStorage.setItem(logKey, JSON.stringify(logs));
    } catch (error) {
      console.warn('Failed to write log to storage:', error);
    }
  }

  // Public logging methods
  debug(category: string, message: string, data?: any) {
    this.log(this.createLogEntry('DEBUG', category, message, data));
  }

  info(category: string, message: string, data?: any) {
    this.log(this.createLogEntry('INFO', category, message, data));
  }

  warn(category: string, message: string, data?: any) {
    this.log(this.createLogEntry('WARN', category, message, data));
  }

  error(category: string, message: string, data?: any) {
    this.log(this.createLogEntry('ERROR', category, message, data));
  }

  // Specialized logging methods for auto-scroll debugging
  logKeyboardEvent(eventData: KeyboardEventData) {
    this.info('KEYBOARD', `Key pressed: ${eventData.key}`, {
      ...eventData,
      indexChange: eventData.newIndex - eventData.currentIndex
    });
  }

  logScrollOperation(operation: string, scrollData: ScrollDebugData) {
    const { needsScroll, targetIndex, newScrollTop } = scrollData;
    const action = needsScroll ? 'EXECUTING' : 'SKIPPING';

    this.info('SCROLL', `${action} scroll operation: ${operation}`, {
      operation,
      targetIndex,
      needsScroll,
      newScrollTop,
      calculations: {
        itemTop: scrollData.targetItemTop,
        itemBottom: scrollData.targetItemBottom,
        visibleTop: scrollData.visibleTop,
        visibleBottom: scrollData.visibleBottom,
        bufferSize: scrollData.bufferSize
      },
      viewport: {
        scrollTop: scrollData.scrollTop,
        containerHeight: scrollData.containerHeight,
        visibleRange: scrollData.visibleRange
      }
    });
  }

  logScrollResult(success: boolean, actualScrollTop: number, targetScrollTop: number) {
    const difference = Math.abs(actualScrollTop - targetScrollTop);
    const level = success && difference < 5 ? 'INFO' : 'WARN';

    this.log(this.createLogEntry(level, 'SCROLL', 'Scroll operation completed', {
      success,
      actualScrollTop,
      targetScrollTop,
      difference,
      accuracy: success ? (difference < 5 ? 'PRECISE' : 'APPROXIMATE') : 'FAILED'
    }));
  }

  logFileListState(stateData: FileListStateData) {
    this.debug('FILE_LIST', 'File list state updated', stateData);
  }

  logVirtualScrollState(itemCount: number, visibleRange: { start: number; end: number }, scrollTop: number) {
    this.debug('VIRTUAL_SCROLL', 'Virtual scroll state', {
      itemCount,
      visibleRange,
      scrollTop,
      visibleItemCount: visibleRange.end - visibleRange.start + 1
    });
  }

  logPerformance(operation: string, duration: number, additionalData?: any) {
    const level = duration > 16 ? 'WARN' : 'DEBUG'; // 16ms = 60fps threshold

    this.log(this.createLogEntry(level, 'PERFORMANCE', `${operation} took ${duration.toFixed(2)}ms`, {
      operation,
      duration,
      fps: Math.round(1000 / duration),
      ...additionalData
    }));
  }

  // Log analysis and export methods
  exportLogs(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      totalLogs: this.logs.length,
      logs: this.logs
    }, null, 2);
  }

  getScrollOperationSummary(): any {
    const scrollLogs = this.logs.filter(log => log.category === 'SCROLL');
    const keyboardLogs = this.logs.filter(log => log.category === 'KEYBOARD');

    return {
      totalScrollOperations: scrollLogs.length,
      totalKeyboardEvents: keyboardLogs.length,
      scrollSuccessRate: scrollLogs.filter(log =>
        log.data?.success !== false
      ).length / Math.max(scrollLogs.length, 1),
      averageScrollAccuracy: scrollLogs.reduce((acc, log) =>
        acc + (log.data?.difference || 0), 0) / Math.max(scrollLogs.length, 1),
      performanceIssues: this.logs.filter(log =>
        log.level === 'WARN' && log.category === 'PERFORMANCE'
      ).length
    };
  }

  clearLogs() {
    this.logs = [];
    this.info('SYSTEM', 'Debug logs cleared');
  }
}

// Create global instance
export const debugLogger = new DebugLogger();

// Utility functions for common logging patterns
export const logScrollToIndex = (index: number, behavior: 'auto' | 'smooth' = 'auto') => {
  debugLogger.info('SCROLL_TO_INDEX', `Called with index ${index}, behavior: ${behavior}`, {
    targetIndex: index,
    behavior,
    timestamp: performance.now()
  });
};

export const logScrollCalculations = (data: Partial<ScrollDebugData>) => {
  debugLogger.debug('SCROLL_CALC', 'Scroll calculations performed', data);
};

export const logDOMScrollOperation = (element: HTMLElement, newScrollTop: number) => {
  const oldScrollTop = element.scrollTop;
  debugLogger.debug('DOM_SCROLL', `Setting scrollTop from ${oldScrollTop} to ${newScrollTop}`, {
    oldScrollTop,
    newScrollTop,
    elementType: element.tagName,
    elementId: element.id,
    elementClasses: element.className
  });
};

export const startPerformanceTimer = (operation: string): (() => void) => {
  const startTime = performance.now();
  return () => {
    const duration = performance.now() - startTime;
    debugLogger.logPerformance(operation, duration);
  };
};

// Export types for use in components
export type { ScrollDebugData, KeyboardEventData, FileListStateData };