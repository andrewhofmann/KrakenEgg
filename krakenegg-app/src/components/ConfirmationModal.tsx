import * as Dialog from '@radix-ui/react-dialog';
import { useStore } from '../store';
import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const ConfirmationModal = () => {
  const { show, title, message, onConfirm, showConflictOptions } = useStore((state) => state.confirmation);
  const closeConfirmation = useStore((state) => state.closeConfirmation);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  
  const [strategy, setStrategy] = useState('prompt');

  useEffect(() => {
    if (show) {
      setTimeout(() => cancelRef.current?.focus(), 50);
      setStrategy('prompt'); // Reset
    }
  }, [show]);

  const handleConfirm = () => {
    onConfirm(showConflictOptions ? strategy : undefined);
    closeConfirmation();
  };

  return (
    <Dialog.Root open={show} onOpenChange={(open) => !open && closeConfirmation()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] animate-fade-in" />
        <Dialog.Content 
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-macos-glass border border-white/10 rounded-lg shadow-2xl p-6 z-[151] focus:outline-none animate-scale-in"
        >
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold text-white">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="text-macos-textSecondary hover:text-white">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>
          
          <Dialog.Description className="text-sm text-white/80 mb-6">
            {message}
          </Dialog.Description>

          {showConflictOptions && (
              <div className="mb-6 space-y-3 bg-black/20 p-3 rounded-md border border-white/5">
                  <div className="text-xs font-semibold text-macos-textSecondary uppercase tracking-wider">Conflict Resolution</div>
                  <div className="space-y-2">
                      {[
                          { id: 'prompt', label: 'Ask for each conflict (Default)' },
                          { id: 'overwrite', label: 'Overwrite All' },
                          { id: 'skip', label: 'Skip Existing' },
                          { id: 'newer', label: 'Overwrite only if newer' }
                      ].map(opt => (
                          <label key={opt.id} className="flex items-center space-x-3 text-sm text-white/90 cursor-pointer hover:bg-white/5 p-1 rounded -ml-1">
                              <input 
                                  type="radio" 
                                  name="conflictStrategy" 
                                  value={opt.id} 
                                  checked={strategy === opt.id} 
                                  onChange={(e) => setStrategy(e.target.value)}
                                  className="accent-macos-active w-4 h-4"
                              />
                              <span>{opt.label}</span>
                          </label>
                      ))}
                  </div>
              </div>
          )}

          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <button 
                ref={cancelRef}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-md transition-colors"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button 
              ref={confirmRef}
              onClick={handleConfirm}
              className="px-4 py-2 bg-macos-active hover:bg-macos-activeHover text-white text-sm rounded-md transition-colors font-medium"
            >
              Confirm
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
