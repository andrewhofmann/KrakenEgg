import * as Dialog from '@radix-ui/react-dialog';
import { useStore } from '../store';
import { ArrowRight } from 'lucide-react';

export const ConflictModal = () => {
  const { conflict } = useStore((state) => state.operationStatus);
  const resolveConflict = useStore((state) => state.resolveConflict);

  if (!conflict) return null;

  const sourceName = conflict.source.split('/').pop() || conflict.source;
  const destName = conflict.dest.split('/').pop() || conflict.dest;

  return (
    <Dialog.Root open={!!conflict}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300]" />
        <Dialog.Content
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-macos-glass border border-white/10 rounded-lg p-6 w-[480px] z-[301] focus:outline-none shadow-2xl animate-scale-in"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--ke-text)' }}>File Conflict</h3>

          <div className="flex items-center gap-3 mb-4 p-3 rounded-md" style={{ backgroundColor: 'var(--ke-bg-input)', border: '1px solid var(--ke-border-subtle)' }}>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--ke-text-tertiary)' }}>Source</div>
              <div className="text-sm truncate font-medium" style={{ color: 'var(--ke-text)' }}>{sourceName}</div>
              <div className="text-[10px] truncate mt-0.5" style={{ color: 'var(--ke-text-disabled)' }} title={conflict.source}>{conflict.source}</div>
            </div>
            <ArrowRight size={16} className="shrink-0" style={{ color: 'var(--ke-text-disabled)' }} />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--ke-text-tertiary)' }}>Destination</div>
              <div className="text-sm truncate font-medium" style={{ color: 'var(--ke-text)' }}>{destName}</div>
              <div className="text-[10px] truncate mt-0.5" style={{ color: 'var(--ke-text-disabled)' }} title={conflict.dest}>{conflict.dest}</div>
            </div>
          </div>

          <p className="text-xs mb-4" style={{ color: 'var(--ke-text-secondary)' }}>
            {conflict.is_dir ? 'A folder' : 'A file'} with this name already exists at the destination.
          </p>

          <div className="flex flex-col gap-2">
             <div className="flex gap-2 justify-end">
                <button
                    onClick={() => resolveConflict(conflict.id, 'Overwrite')}
                    className="px-3 py-1.5 rounded text-sm transition-colors font-medium"
                    style={{ backgroundColor: 'var(--ke-error)', color: 'var(--ke-text)' }}
                >
                    Overwrite
                </button>
                <button
                    onClick={() => resolveConflict(conflict.id, 'Skip')}
                    className="px-3 py-1.5 rounded text-sm transition-colors"
                    style={{ backgroundColor: 'var(--ke-bg-hover)', color: 'var(--ke-text)' }}
                >
                    Skip
                </button>
             </div>
             <div className="flex gap-2 justify-end pt-2 mt-1" style={{ borderTop: '1px solid var(--ke-border-subtle)' }}>
                <button
                    onClick={() => resolveConflict(conflict.id, 'OverwriteAll')}
                    className="px-3 py-1.5 rounded text-xs transition-colors"
                    style={{ backgroundColor: 'var(--ke-error-bg)', color: 'var(--ke-text)' }}
                >
                    Overwrite All
                </button>
                <button
                    onClick={() => resolveConflict(conflict.id, 'SkipAll')}
                    className="px-3 py-1.5 rounded text-xs transition-colors"
                    style={{ backgroundColor: 'var(--ke-bg-hover)', color: 'var(--ke-text)' }}
                >
                    Skip All
                </button>
                <button
                    onClick={() => resolveConflict(conflict.id, 'Cancel')}
                    className="px-3 py-1.5 text-xs transition-colors ml-auto"
                    style={{ color: 'var(--ke-error)' }}
                >
                    Cancel
                </button>
             </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
