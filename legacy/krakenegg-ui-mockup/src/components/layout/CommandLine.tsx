import React, { useState, useRef, useEffect } from 'react';
import { Terminal } from 'lucide-react';

interface CommandLineProps {
  onExecuteCommand: (command: string) => void;
}

const CommandLine: React.FC<CommandLineProps> = ({ onExecuteCommand }) => {
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus command line when it's shown
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim()) {
      onExecuteCommand(command.trim());
      setHistory(prev => [...prev, command.trim()]);
      setCommand('');
      setHistoryIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (history.length > 0) {
          const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
          setHistoryIndex(newIndex);
          setCommand(history[newIndex]);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (historyIndex !== -1) {
          const newIndex = historyIndex + 1;
          if (newIndex >= history.length) {
            setHistoryIndex(-1);
            setCommand('');
          } else {
            setHistoryIndex(newIndex);
            setCommand(history[newIndex]);
          }
        }
        break;

      case 'Escape':
        setCommand('');
        setHistoryIndex(-1);
        break;
    }
  };

  const commonCommands = [
    { cmd: 'ls', desc: 'List directory contents' },
    { cmd: 'cd', desc: 'Change directory' },
    { cmd: 'mkdir', desc: 'Create directory' },
    { cmd: 'rm', desc: 'Remove files' },
    { cmd: 'cp', desc: 'Copy files' },
    { cmd: 'mv', desc: 'Move files' },
    { cmd: 'find', desc: 'Search for files' },
    { cmd: 'grep', desc: 'Search text in files' }
  ];

  return (
    <div className="panel-header border-t border-macos-border-light dark:border-macos-border-dark">
      <div className="px-4 py-2">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Terminal size={16} className="text-macos-text-secondary-light dark:text-macos-text-secondary-dark" />
          <span className="text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
            $
          </span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-sm font-mono focus-visible-ring"
            placeholder="Enter command... (↑/↓ for history, Tab for completion)"
            autoComplete="off"
            spellCheck="false"
          />
          <div className="flex items-center gap-2 text-xs text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
            <span>Press Ctrl+C to copy, Ctrl+V to paste</span>
          </div>
        </form>
      </div>

      {/* Command suggestions (shown when input is focused and empty) */}
      {command === '' && (
        <div className="px-4 pb-2">
          <div className="text-xs text-macos-text-secondary-light dark:text-macos-text-secondary-dark">
            Common commands: {commonCommands.map((cmd, index) => (
              <span key={cmd.cmd}>
                <button
                  className="hover:text-macos-blue cursor-pointer"
                  onClick={() => setCommand(cmd.cmd + ' ')}
                  title={cmd.desc}
                >
                  {cmd.cmd}
                </button>
                {index < commonCommands.length - 1 && ', '}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CommandLine;