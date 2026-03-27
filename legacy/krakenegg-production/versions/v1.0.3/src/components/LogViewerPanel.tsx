import React, { useState, useEffect, useRef } from 'react';
import logService, { LogEntry, LogLevel, LogCategory } from '../services/logService';

interface LogViewerPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogViewerPanel: React.FC<LogViewerPanelProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<Set<LogLevel>>(new Set(Object.values(LogLevel)));
  const [selectedCategories, setSelectedCategories] = useState<Set<LogCategory>>(new Set(Object.values(LogCategory)));
  const [searchTerm, setSearchTerm] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [showExport, setShowExport] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const updateLogs = () => {
      const allLogs = logService.getLogs();
      setLogs(allLogs);
    };

    // Initial load
    updateLogs();

    // Listen for new logs
    const handleNewLog = () => {
      updateLogs();
    };

    window.addEventListener('kraken-log', handleNewLog);

    // Poll for updates (fallback)
    const interval = setInterval(updateLogs, 1000);

    return () => {
      window.removeEventListener('kraken-log', handleNewLog);
      clearInterval(interval);
    };
  }, [isOpen]);

  useEffect(() => {
    // Filter logs based on criteria
    let filtered = logs;

    // Filter by levels
    if (selectedLevels.size < Object.values(LogLevel).length) {
      filtered = filtered.filter(log => selectedLevels.has(log.level));
    }

    // Filter by categories
    if (selectedCategories.size < Object.values(LogCategory).length) {
      filtered = filtered.filter(log => selectedCategories.has(log.category));
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(term) ||
        JSON.stringify(log.data || {}).toLowerCase().includes(term) ||
        JSON.stringify(log.context || {}).toLowerCase().includes(term)
      );
    }

    setFilteredLogs(filtered);
  }, [logs, selectedLevels, selectedCategories, searchTerm]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll]);

  const toggleLevel = (level: LogLevel) => {
    const newLevels = new Set(selectedLevels);
    if (newLevels.has(level)) {
      newLevels.delete(level);
    } else {
      newLevels.add(level);
    }
    setSelectedLevels(newLevels);
  };

  const toggleCategory = (category: LogCategory) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
  };

  const exportLogs = (format: 'json' | 'csv' | 'txt') => {
    const exported = logService.exportLogs(format);
    const blob = new Blob([exported], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `krakenegg-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logService.logUserAction(`Exported logs in ${format} format`, { format, logCount: filteredLogs.length });
  };

  const clearLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      logService.clearLogs();
      setLogs([]);
      logService.logUserAction('Cleared all logs');
    }
  };

  const getLogLevelIcon = (level: LogLevel): string => {
    switch (level) {
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '❌';
      case LogLevel.USER_ACTION: return '🎮';
      case LogLevel.SYSTEM: return '⚙️';
      default: return '📝';
    }
  };

  const getLogLevelColor = (level: LogLevel): string => {
    switch (level) {
      case LogLevel.DEBUG: return 'text-gray-500';
      case LogLevel.INFO: return 'text-blue-600';
      case LogLevel.WARN: return 'text-yellow-600';
      case LogLevel.ERROR: return 'text-red-600';
      case LogLevel.USER_ACTION: return 'text-purple-600';
      case LogLevel.SYSTEM: return 'text-green-600';
      default: return 'text-gray-700';
    }
  };

  const getCategoryIcon = (category: LogCategory): string => {
    switch (category) {
      case LogCategory.FILE_OPERATION: return '📁';
      case LogCategory.NAVIGATION: return '🧭';
      case LogCategory.UI_INTERACTION: return '🖱️';
      case LogCategory.BACKEND_COMMAND: return '🔧';
      case LogCategory.ERROR_HANDLING: return '💥';
      case LogCategory.PERFORMANCE: return '⚡';
      case LogCategory.TEST_FRAMEWORK: return '🧪';
      default: return '📝';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const statistics = logService.getStatistics();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold">🦑 KrakenEgg Activity Logger</h2>
            <div className="text-sm bg-blue-700 px-2 py-1 rounded">
              {filteredLogs.length} of {logs.length} logs
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowExport(!showExport)}
              className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm"
            >
              Export
            </button>
            <button
              onClick={clearLogs}
              className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
            >
              Clear
            </button>
            <button
              onClick={onClose}
              className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded text-sm"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Export Menu */}
        {showExport && (
          <div className="bg-gray-100 px-6 py-2 border-b flex space-x-2">
            <button onClick={() => exportLogs('json')} className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm">
              Export JSON
            </button>
            <button onClick={() => exportLogs('csv')} className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm">
              Export CSV
            </button>
            <button onClick={() => exportLogs('txt')} className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm">
              Export TXT
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="bg-gray-50 px-6 py-3 border-b text-sm">
          <div className="flex space-x-6">
            <span>📊 Total: {statistics.totalLogs}</span>
            <span>❌ Errors: {statistics.errorCount}</span>
            <span>⚠️ Warnings: {statistics.warningCount}</span>
            <span>⏱️ Session: {Math.round(statistics.sessionDuration / 1000 / 60)}min</span>
            <span>📈 Error Rate: {statistics.recentErrorRate.toFixed(1)}%</span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 px-6 py-3 border-b space-y-3">
          {/* Search */}
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-1 border rounded text-sm"
            />
            <label className="flex items-center space-x-1 text-sm">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
              />
              <span>Auto-scroll</span>
            </label>
          </div>

          {/* Level Filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium">Levels:</span>
            {Object.values(LogLevel).map((level) => (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={`px-2 py-1 rounded text-xs ${
                  selectedLevels.has(level)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {getLogLevelIcon(level)} {level}
              </button>
            ))}
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium">Categories:</span>
            {Object.values(LogCategory).map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-2 py-1 rounded text-xs ${
                  selectedCategories.has(category)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {getCategoryIcon(category)} {category}
              </button>
            ))}
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-auto font-mono text-sm">
          {filteredLogs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              No logs match the current filters
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className={`border-l-4 pl-3 py-2 ${
                    log.level === LogLevel.ERROR ? 'border-red-500 bg-red-50' :
                    log.level === LogLevel.WARN ? 'border-yellow-500 bg-yellow-50' :
                    log.level === LogLevel.USER_ACTION ? 'border-purple-500 bg-purple-50' :
                    'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`font-medium ${getLogLevelColor(log.level)}`}>
                          {getLogLevelIcon(log.level)} {log.level}
                        </span>
                        <span className="text-gray-500">
                          {getCategoryIcon(log.category)} {log.category}
                        </span>
                        <span className="text-gray-400 text-xs">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <div className="text-gray-800 mb-1">
                        {log.message}
                      </div>
                      {(log.data || log.context) && (
                        <div className="text-xs text-gray-600 space-y-1">
                          {log.context && (
                            <div>
                              <strong>Context:</strong> {JSON.stringify(log.context, null, 2)}
                            </div>
                          )}
                          {log.data && (
                            <div>
                              <strong>Data:</strong> {JSON.stringify(log.data, null, 2)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogViewerPanel;