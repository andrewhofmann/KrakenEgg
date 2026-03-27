import { useStore } from "../store";
import { X, Save } from "lucide-react";

export const EditorModal = () => {
  const { show, title, content, loading, error, dirty } = useStore((state) => state.editor);
  const hideEditor = useStore((state) => state.hideEditor);
  const setEditorContent = useStore((state) => state.setEditorContent);
  const saveEditorContent = useStore((state) => state.saveEditorContent);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50">
      <div className="relative flex flex-col w-full max-w-4xl h-3/4 rounded-lg shadow-2xl bg-macos-glass border border-[var(--ke-border)]">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-[var(--ke-border)] shrink-0">
          <h3 className="text-sm font-semibold text-[var(--ke-text)] truncate">
            {title} {dirty && <span className="text-yellow-400 ml-2"> (Unsaved)</span>}
          </h3>
          <div className="flex space-x-2">
            <button 
              onClick={saveEditorContent} 
              disabled={!dirty || loading}
              className="flex items-center px-2 py-1 rounded-md bg-[var(--ke-accent)] hover:bg-[var(--ke-accent-hover)] text-[var(--ke-text)] text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={14} className="mr-1" /> Save
            </button>
            <button onClick={hideEditor} className="p-1 rounded-md hover:bg-[var(--ke-bg-hover)] text-macos-textSecondary hover:text-[var(--ke-text)] transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto font-mono text-xs text-[var(--ke-text-secondary)] whitespace-pre-wrap no-scrollbar">
          {loading && <div className="text-center py-8">Loading...</div>}
          {error && <div className="text-[var(--ke-error)] py-8">Error: {error}</div>}
          {!loading && !error && (
            <textarea
              className="w-full h-full bg-transparent text-[var(--ke-text)] p-4 focus:outline-none resize-none"
              value={content}
              onChange={(e) => setEditorContent(e.target.value)}
              spellCheck="false"
            />
          )}
        </div>
      </div>
    </div>
  );
};
