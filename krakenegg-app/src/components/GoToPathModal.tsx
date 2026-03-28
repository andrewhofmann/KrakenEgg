import { useRef, useEffect } from 'react';
import { useStore } from '../store';

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
      <div role="dialog" aria-label="Go To Path" className="p-6 rounded-lg shadow-xl max-w-lg w-full" style={{ backgroundColor: 'var(--ke-bg-elevated)', border: '1px solid var(--ke-border)' }}>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ke-text)' }}>Go To Path</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--ke-text-secondary)' }}>Enter the full path to navigate to:</p>
        <input
          ref={inputRef}
          type="text"
          defaultValue={initialPath}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 rounded-md border focus:outline-none"
          style={{ backgroundColor: 'var(--ke-bg-input)', color: 'var(--ke-text)', borderColor: 'var(--ke-border)' }}
          placeholder="/Users/username/Documents"
        />
        <div className="mt-6 flex justify-end space-x-3">
          <button
            aria-label="Cancel"
            onClick={handleCancel}
            className="px-4 py-2 rounded-md text-sm font-medium focus:outline-none transition-colors"
            style={{ backgroundColor: 'var(--ke-bg-hover)', color: 'var(--ke-text)' }}
          >
            Cancel
          </button>
          <button
            aria-label="Go"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-md text-sm font-medium focus:outline-none transition-colors"
            style={{ backgroundColor: 'var(--ke-accent)', color: 'var(--ke-text)' }}
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
};