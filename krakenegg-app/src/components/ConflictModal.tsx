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
          <h3 className="text-lg font-bold text-white mb-3">File Conflict</h3>

          <div className="flex items-center gap-3 mb-4 p-3 bg-black/20 rounded-md border border-white/5">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Source</div>
              <div className="text-sm text-white truncate font-medium">{sourceName}</div>
              <div className="text-[10px] text-white/30 truncate mt-0.5" title={conflict.source}>{conflict.source}</div>
            </div>
            <ArrowRight size={16} className="text-white/30 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Destination</div>
              <div className="text-sm text-white truncate font-medium">{destName}</div>
              <div className="text-[10px] text-white/30 truncate mt-0.5" title={conflict.dest}>{conflict.dest}</div>
            </div>
          </div>

          <p className="text-xs text-white/60 mb-4">
            {conflict.is_dir ? 'A folder' : 'A file'} with this name already exists at the destination.
          </p>

          <div className="flex flex-col gap-2">
             <div className="flex gap-2 justify-end">
                <button
                    onClick={() => resolveConflict(conflict.id, 'Overwrite')}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-sm transition-colors font-medium"
                >
                    Overwrite
                </button>
                <button
                    onClick={() => resolveConflict(conflict.id, 'Skip')}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-colors"
                >
                    Skip
                </button>
             </div>
             <div className="flex gap-2 justify-end border-t border-white/10 pt-2 mt-1">
                <button
                    onClick={() => resolveConflict(conflict.id, 'OverwriteAll')}
                    className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800/50 text-white rounded text-xs transition-colors"
                >
                    Overwrite All
                </button>
                <button
                    onClick={() => resolveConflict(conflict.id, 'SkipAll')}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-xs transition-colors"
                >
                    Skip All
                </button>
                <button
                    onClick={() => resolveConflict(conflict.id, 'Cancel')}
                    className="px-3 py-1.5 text-red-400 hover:text-red-300 text-xs transition-colors ml-auto"
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
