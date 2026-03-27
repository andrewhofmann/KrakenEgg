import * as Dialog from '@radix-ui/react-dialog';
import { useStore } from '../store';

export const ConflictModal = () => {
  const { conflict } = useStore((state) => state.operationStatus);
  const resolveConflict = useStore((state) => state.resolveConflict);

  if (!conflict) return null;

  return (
    <Dialog.Root open={!!conflict}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[300]" />
        <Dialog.Content 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-macos-glass border border-white/10 rounded-lg p-6 w-[400px] z-[301] focus:outline-none shadow-2xl animate-scale-in"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <h3 className="text-lg font-bold text-white mb-2">File Conflict</h3>
          <p className="text-sm text-white/80 mb-4">
            Destination already exists:<br/>
            <span className="font-mono text-xs break-all text-blue-300">{conflict.dest}</span>
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
             <div className="flex gap-2 justify-end border-t border-white/10 pt-2 mt-2">
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
