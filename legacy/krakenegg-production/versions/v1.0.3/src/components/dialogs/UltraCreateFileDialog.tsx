import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Code,
  FileImage,
  FileVideo,
  FileAudio,
  Database,
  Settings,
  Hash,
  FileSpreadsheet,
  Globe,
  Terminal,
  Coffee,
  Palette,
  Zap,
  FolderOpen
} from 'lucide-react';
import CompactDialog from './CompactDialog';

interface FileTemplate {
  id: string;
  name: string;
  extension: string;
  icon: React.ReactNode;
  description: string;
  category: 'document' | 'code' | 'media' | 'data' | 'system';
  content?: string;
  appSuggestion?: string;
}

interface UltraCreateFileDialogProps {
  onClose: () => void;
  onCreateFile?: (name: string, content: string, openWith?: string) => void;
  currentPath?: string;
}

const UltraCreateFileDialog = ({ onClose, onCreateFile, currentPath }: UltraCreateFileDialogProps) => {
  const [fileName, setFileName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<FileTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('document');

  const fileTemplates: FileTemplate[] = [
    // Document templates
    {
      id: 'txt',
      name: 'Text Document',
      extension: '.txt',
      icon: <FileText size={16} className="text-blue-500" />,
      description: 'Plain text document',
      category: 'document',
      content: '',
      appSuggestion: 'TextEdit'
    },
    {
      id: 'md',
      name: 'Markdown Document',
      extension: '.md',
      icon: <Hash size={16} className="text-blue-600" />,
      description: 'Markdown formatted text',
      category: 'document',
      content: '# New Document\n\nStart writing here...\n',
      appSuggestion: 'Typora'
    },
    {
      id: 'rtf',
      name: 'Rich Text Format',
      extension: '.rtf',
      icon: <FileText size={16} className="text-purple-500" />,
      description: 'Rich text with formatting',
      category: 'document',
      appSuggestion: 'TextEdit'
    },

    // Code templates
    {
      id: 'js',
      name: 'JavaScript',
      extension: '.js',
      icon: <Coffee size={16} className="text-yellow-500" />,
      description: 'JavaScript source file',
      category: 'code',
      content: '// JavaScript file\n\nconsole.log("Hello, World!");\n',
      appSuggestion: 'VS Code'
    },
    {
      id: 'ts',
      name: 'TypeScript',
      extension: '.ts',
      icon: <Zap size={16} className="text-blue-600" />,
      description: 'TypeScript source file',
      category: 'code',
      content: '// TypeScript file\n\nfunction greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));\n',
      appSuggestion: 'VS Code'
    },
    {
      id: 'py',
      name: 'Python Script',
      extension: '.py',
      icon: <Code size={16} className="text-green-500" />,
      description: 'Python source file',
      category: 'code',
      content: '#!/usr/bin/env python3\n# Python script\n\nprint("Hello, World!")\n',
      appSuggestion: 'PyCharm'
    },
    {
      id: 'swift',
      name: 'Swift',
      extension: '.swift',
      icon: <Zap size={16} className="text-orange-500" />,
      description: 'Swift source file',
      category: 'code',
      content: '// Swift file\nimport Foundation\n\nprint("Hello, World!")\n',
      appSuggestion: 'Xcode'
    },
    {
      id: 'sh',
      name: 'Shell Script',
      extension: '.sh',
      icon: <Terminal size={16} className="text-gray-600" />,
      description: 'Bash shell script',
      category: 'code',
      content: '#!/bin/bash\n\necho "Hello, World!"\n',
      appSuggestion: 'Terminal'
    },
    {
      id: 'html',
      name: 'HTML Document',
      extension: '.html',
      icon: <Globe size={16} className="text-orange-600" />,
      description: 'HTML web page',
      category: 'code',
      content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>\n',
      appSuggestion: 'VS Code'
    },
    {
      id: 'css',
      name: 'CSS Stylesheet',
      extension: '.css',
      icon: <Palette size={16} className="text-blue-500" />,
      description: 'CSS style sheet',
      category: 'code',
      content: '/* CSS Stylesheet */\n\nbody {\n    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;\n    margin: 0;\n    padding: 20px;\n}\n',
      appSuggestion: 'VS Code'
    },

    // Data templates
    {
      id: 'json',
      name: 'JSON Data',
      extension: '.json',
      icon: <Database size={16} className="text-yellow-600" />,
      description: 'JSON data file',
      category: 'data',
      content: '{\n  "name": "example",\n  "version": "1.0.0",\n  "description": "A JSON file"\n}\n',
      appSuggestion: 'VS Code'
    },
    {
      id: 'xml',
      name: 'XML Document',
      extension: '.xml',
      icon: <Code size={16} className="text-red-500" />,
      description: 'XML markup document',
      category: 'data',
      content: '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n    <item>Example</item>\n</root>\n',
      appSuggestion: 'VS Code'
    },
    {
      id: 'csv',
      name: 'CSV Spreadsheet',
      extension: '.csv',
      icon: <FileSpreadsheet size={16} className="text-green-600" />,
      description: 'Comma-separated values',
      category: 'data',
      content: 'Name,Email,Phone\nJohn Doe,john@example.com,555-0123\n',
      appSuggestion: 'Numbers'
    },

    // System templates
    {
      id: 'plist',
      name: 'Property List',
      extension: '.plist',
      icon: <Settings size={16} className="text-gray-500" />,
      description: 'macOS property list',
      category: 'system',
      content: '<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n<dict>\n    <key>Example</key>\n    <string>Value</string>\n</dict>\n</plist>\n',
      appSuggestion: 'Xcode'
    },
    {
      id: 'env',
      name: 'Environment Variables',
      extension: '.env',
      icon: <Settings size={16} className="text-green-400" />,
      description: 'Environment configuration',
      category: 'system',
      content: '# Environment Variables\nNODE_ENV=development\nPORT=3000\n',
      appSuggestion: 'VS Code'
    }
  ];

  const categories = [
    { id: 'document', name: 'Documents', icon: <FileText size={14} /> },
    { id: 'code', name: 'Code', icon: <Code size={14} /> },
    { id: 'data', name: 'Data', icon: <Database size={14} /> },
    { id: 'system', name: 'System', icon: <Settings size={14} /> }
  ];

  const filteredTemplates = fileTemplates.filter(template =>
    selectedCategory === 'all' || template.category === selectedCategory
  );

  const handleTemplateSelect = (template: FileTemplate) => {
    setSelectedTemplate(template);
    if (!fileName.trim()) {
      setFileName(`Untitled${template.extension}`);
    } else if (!fileName.includes('.')) {
      setFileName(fileName + template.extension);
    }
  };

  const handleCreate = () => {
    if (!fileName.trim()) return;

    const content = selectedTemplate?.content || '';
    const appSuggestion = selectedTemplate?.appSuggestion;

    onCreateFile?.(fileName, content, appSuggestion);
    onClose();
  };

  const handleOpenWith = () => {
    if (selectedTemplate?.appSuggestion) {
      handleCreate();
    }
  };

  return (
    <CompactDialog
      title="Create New File"
      icon={<FileText size={14} className="text-white" />}
      iconColor="bg-mac26-blue-500"
      onClose={onClose}
      onConfirm={handleCreate}
      onCancel={onClose}
      confirmText="Create"
      confirmDisabled={!fileName.trim()}
      size="md"
    >
      <div className="space-y-4">
        {/* Current path */}
        {currentPath && (
          <div className="flex items-center gap-2 text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark rounded px-2 py-1">
            <FolderOpen size={12} />
            <span>Create in: {currentPath}</span>
          </div>
        )}

        {/* File name input */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
            File Name:
          </label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && fileName.trim()) {
                e.preventDefault();
                handleCreate();
              }
            }}
            className="w-full text-sm px-3 py-2 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border border-mac26-border-primary-light dark:border-mac26-border-primary-dark rounded-md focus:outline-none focus:border-mac26-blue-500"
            placeholder="Enter file name..."
            autoFocus
          />
        </div>

        {/* Category tabs */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
            Template Category:
          </label>
          <div className="flex gap-1">
            {categories.map(category => (
              <button
                key={category.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150 ${
                  selectedCategory === category.id
                    ? 'bg-mac26-blue-500 text-white'
                    : 'bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Template selection */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
            File Template:
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {filteredTemplates.map(template => (
              <motion.button
                key={template.id}
                className={`flex items-start gap-2 p-2 rounded-md text-left transition-all duration-150 ${
                  selectedTemplate?.id === template.id
                    ? 'bg-mac26-blue-500/10 border border-mac26-blue-500/30 text-mac26-blue-600 dark:text-mac26-blue-400'
                    : 'bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark border border-transparent'
                }`}
                onClick={() => handleTemplateSelect(template)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {template.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark truncate">
                    {template.name}
                  </div>
                  <div className="text-xs text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark truncate">
                    {template.description}
                  </div>
                  <div className="text-xs text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark font-mono">
                    {template.extension}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Selected template info */}
        {selectedTemplate && (
          <div className="p-3 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark rounded-md border border-mac26-border-primary-light dark:border-mac26-border-primary-dark">
            <div className="flex items-center gap-2 mb-2">
              {selectedTemplate.icon}
              <span className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                {selectedTemplate.name}
              </span>
            </div>
            <p className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark mb-2">
              {selectedTemplate.description}
            </p>
            {selectedTemplate.appSuggestion && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-mac26-text-tertiary-light dark:text-mac26-text-tertiary-dark">
                  Suggested app: {selectedTemplate.appSuggestion}
                </span>
                <button
                  className="text-xs px-2 py-1 bg-mac26-blue-500 hover:bg-mac26-blue-600 text-white rounded transition-colors duration-150"
                  onClick={handleOpenWith}
                  disabled={!fileName.trim()}
                >
                  Create & Open
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </CompactDialog>
  );
};

export default UltraCreateFileDialog;