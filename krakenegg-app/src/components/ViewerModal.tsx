import { useStore } from "../store";
import { X } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Helper to map file extensions to language names for syntax highlighting
const getLanguageFromFileName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'c':
      return 'c';
    case 'cpp':
      return 'cpp';
    case 'cs':
      return 'csharp';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'scss':
      return 'scss';
    case 'json':
      return 'json';
    case 'xml':
      return 'xml';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'md':
      return 'markdown';
    case 'sh':
      return 'bash';
    case 'txt':
      return 'text';
    default:
      return 'text'; // Fallback to plain text
  }
};

export const ViewerModal = () => {
  const { show, title, content, loading, error, isImage } = useStore((state) => state.viewer);
  const hideViewer = useStore((state) => state.hideViewer);

  if (!show) return null;

  const language = getLanguageFromFileName(title);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50">
      <div role="dialog" aria-label="File Viewer" className="relative flex flex-col w-full max-w-4xl h-3/4 rounded-lg shadow-2xl bg-macos-glass border border-[var(--ke-border)]">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[var(--ke-border)] shrink-0">
          <h3 className="text-sm font-semibold text-[var(--ke-text)] truncate">{title}</h3>
          <button aria-label="Close" onClick={hideViewer} className="p-1 rounded-md hover:bg-[var(--ke-bg-hover)] text-macos-textSecondary hover:text-[var(--ke-text)] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-auto text-[var(--ke-text-secondary)] no-scrollbar">
          {loading && <div className="text-center py-8">Loading...</div>}
          {error && <div className="text-[var(--ke-error)] py-8">Error: {error}</div>}
          {!loading && !error && (
            isImage ? (
              <img src={content} alt={title} className="max-w-full max-h-full object-contain mx-auto" />
            ) : (
              <SyntaxHighlighter language={language} style={darcula} customStyle={{ 
                margin: 0, 
                backgroundColor: 'transparent', 
                fontSize: '0.75rem', // text-xs
                lineHeight: '1rem', // leading-none (approx)
              }}>
                {content}
              </SyntaxHighlighter>
            )
          )}
        </div>
      </div>
    </div>
  );
};
