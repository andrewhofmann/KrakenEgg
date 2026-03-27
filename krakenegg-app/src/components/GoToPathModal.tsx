import { useRef, useEffect } from 'react';
import { useStore } from '../store';
import clsx from 'clsx';

export const GoToPathModal = () => {
  const { show, initialPath } = useStore((state) => state.goToPathModal);
  const hideGoToPathModal = useStore((state) => state.hideGoToPathModal);
  const setPath = useStore((state) => state.setPath);
  const activeSide = useStore((state) => state.activeSide);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (show) {
      // Focus the input when the modal opens
      inputRef.current?.focus();
    }
  }, [show]);

  const handleConfirm = () => {
    if (inputRef.current?.value) {
      setPath(activeSide, inputRef.current.value);
    }
    hideGoToPathModal();
  };

  const handleCancel = () => {
    hideGoToPathModal();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-macos-modal-bg p-6 rounded-lg shadow-xl border border-macos-border max-w-lg w-full">
        <h2 className="text-lg font-semibold text-[var(--ke-text)] mb-4">Go To Path</h2>
        <p className="text-sm text-macos-textSecondary mb-4">Enter the full path to navigate to:</p>
        <input
          ref={inputRef}
          type="text"
          defaultValue={initialPath}
          onKeyDown={handleKeyDown}
          className={clsx(
            "w-full px-3 py-2 rounded-md bg-macos-input-bg text-[var(--ke-text)] border",
            "border-macos-border focus:outline-none focus:ring-1 focus:ring-macos-active"
          )}
          placeholder="/Users/username/Documents"
        />
        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className={clsx(
              "px-4 py-2 rounded-md text-sm font-medium",
              "bg-[var(--ke-bg-hover)] hover:bg-[var(--ke-bg-active)] text-[var(--ke-text)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--ke-border)] focus:ring-offset-2 focus:ring-offset-macos-modal-bg"
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={clsx(
              "px-4 py-2 rounded-md text-sm font-medium",
              "bg-[var(--ke-accent)] hover:bg-[var(--ke-accent-hover)] text-[var(--ke-text)]",
              "focus:outline-none focus:ring-2 focus:ring-macos-active focus:ring-offset-2 focus:ring-offset-macos-modal-bg"
            )}
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
};