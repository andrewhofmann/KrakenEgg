import * as Dialog from '@radix-ui/react-dialog';
import { useStore } from '../store';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const ConfirmationModal = () => {
  const { show, title, message, onConfirm, showConflictOptions } = useStore((state) => state.confirmation);
  const closeConfirmation = useStore((state) => state.closeConfirmation);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  const [strategy, setStrategy] = useState('prompt');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => cancelRef.current?.focus(), 50);
      setStrategy('prompt');
      setShowAdvanced(false);
      return () => clearTimeout(timer);
    }
  }, [show]);

  const confirmingRef = useRef(false);
  const handleConfirm = () => {
    if (confirmingRef.current) return;
    confirmingRef.current = true;
    onConfirm(showConflictOptions ? strategy : undefined);
    closeConfirmation();
    setTimeout(() => { confirmingRef.current = false; }, 500);
  };

  // Keyboard: Tab moves focus Cancel→Confirm, Enter activates focused button
  // ArrowRight moves focus to Confirm, ArrowLeft to Cancel
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { confirmRef.current?.focus(); }
    if (e.key === 'ArrowLeft') { cancelRef.current?.focus(); }
  };

  return (
    <Dialog.Root open={show} onOpenChange={(open) => !open && closeConfirmation()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150]" />
        <Dialog.Content
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl shadow-2xl z-[151] focus:outline-none overflow-hidden"
            style={{ backgroundColor: 'var(--ke-bg-elevated)', border: '1px solid var(--ke-border)' }}
            onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-5 pt-5 pb-2">
            <Dialog.Title className="text-base font-semibold" style={{ color: 'var(--ke-text)' }}>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button aria-label="Close" className="p-1 rounded-md hover:bg-[var(--ke-bg-hover)] transition-colors" style={{ color: 'var(--ke-text-secondary)' }}>
                <X size={15} />
              </button>
            </Dialog.Close>
          </div>

          {/* Message */}
          <div className="px-5 pb-4">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ke-text-secondary)' }}>
              {message}
            </p>
          </div>

          {/* Conflict Resolution — collapsed by default */}
          {showConflictOptions && (
              <div className="px-5 pb-4">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider transition-colors"
                  style={{ color: 'var(--ke-text-tertiary)' }}
                >
                  {showAdvanced ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  Conflict Resolution
                </button>
                {showAdvanced && (
                  <div className="mt-2 space-y-1 p-3 rounded-lg" style={{ backgroundColor: 'var(--ke-bg-secondary)', border: '1px solid var(--ke-border-subtle)' }}>
                    {[
                        { id: 'prompt', label: 'Ask for each conflict' },
                        { id: 'overwrite', label: 'Overwrite all' },
                        { id: 'skip', label: 'Skip existing' },
                        { id: 'newer', label: 'Overwrite only if newer' }
                    ].map(opt => (
                        <label key={opt.id} className="flex items-center gap-2.5 text-sm cursor-pointer hover:bg-[var(--ke-bg-hover)] px-2 py-1.5 rounded-md transition-colors" style={{ color: 'var(--ke-text)' }}>
                            <input
                                type="radio"
                                name="conflictStrategy"
                                value={opt.id}
                                checked={strategy === opt.id}
                                onChange={(e) => setStrategy(e.target.value)}
                                className="accent-[var(--ke-accent)] w-3.5 h-3.5"
                            />
                            <span>{opt.label}</span>
                        </label>
                    ))}
                  </div>
                )}
              </div>
          )}

          {/* Footer — Cancel focused by default, Tab or ArrowRight to reach Confirm */}
          <div className="flex justify-end gap-2 px-5 py-4" style={{ backgroundColor: 'var(--ke-bg-secondary)', borderTop: '1px solid var(--ke-border-subtle)' }}>
            <Dialog.Close asChild>
              <button
                ref={cancelRef}
                className="px-4 py-[7px] rounded-md text-sm transition-colors focus:ring-2 focus:ring-[var(--ke-accent)] focus:ring-offset-1 outline-none"
                style={{ backgroundColor: 'var(--ke-bg-hover)', color: 'var(--ke-text)' }}
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              ref={confirmRef}
              aria-label="Confirm"
              onClick={handleConfirm}
              className="px-5 py-[7px] rounded-md text-sm font-medium transition-colors focus:ring-2 focus:ring-[var(--ke-accent)] focus:ring-offset-1 outline-none"
              style={{ backgroundColor: 'var(--ke-accent)', color: '#fff' }}
            >
              Confirm
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
