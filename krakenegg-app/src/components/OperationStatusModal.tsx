import { useEffect, useRef } from 'react';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { formatSize } from '../utils/format';
import clsx from 'clsx';

export const OperationStatusModal = () => {
  const { show, message, isError, progress, conflict } = useStore((state) => state.operationStatus);
  const hideOperationStatus = useStore((state) => state.hideOperationStatus);
  const cancelOperation = useStore((state) => state.cancelOperation);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only auto-hide if NOT error and NOT progress AND NOT conflict
    if (show && !isError && !progress && !conflict) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        hideOperationStatus();
      }, 3000);
    } else {
        // Clear auto-hide timer for error, progress, or conflict states
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [show, isError, progress, conflict, hideOperationStatus]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-[250] max-w-md w-full p-4 pointer-events-none" role="status" aria-live="polite">
      <div 
        className={clsx(
          "bg-[var(--ke-bg-elevated)] border rounded-lg shadow-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-right-4 fade-in duration-200 pointer-events-auto backdrop-blur-xl",
          isError ? "border-[var(--ke-error)] bg-[var(--ke-error-bg)]" : "border-[var(--ke-border)] bg-[var(--ke-bg-elevated)]"
        )}
      >
        <div className="flex items-center gap-3">
            {progress ? (
                <Loader2 size={20} className="shrink-0 animate-spin" style={{ color: 'var(--ke-accent)' }} />
            ) : isError ? (
                <XCircle size={20} className="shrink-0" style={{ color: 'var(--ke-error)' }} />
            ) : (
                <CheckCircle size={20} className="shrink-0" style={{ color: 'var(--ke-success)' }} />
            )}
            
            <div className="flex-1 min-w-0 overflow-hidden">
                <div className="text-sm font-medium truncate" style={{ color: isError ? 'var(--ke-error)' : 'var(--ke-text)' }}>
                    {message}
                </div>
                {progress && (
                    <div className="text-[11px] truncate mt-0.5" style={{ color: 'var(--ke-text-tertiary)' }} title={progress.path}>
                        {progress.path}
                    </div>
                )}
            </div>

            {!progress && (
                <button 
                onClick={hideOperationStatus} 
                className={clsx(
                    "p-1 rounded-md transition-colors shrink-0 hover:bg-[var(--ke-bg-hover)]",
                    isError ? "text-[var(--ke-error)]" : "text-[var(--ke-text-secondary)]"
                )}
                >
                <X size={14} />
                </button>
            )}
        </div>

        {progress && (() => {
            const pct = progress.bytes_total > 0
              ? Math.round((progress.bytes_done / progress.bytes_total) * 100)
              : progress.total > 0
                ? Math.round((progress.current / progress.total) * 100)
                : 0;
            return (
              <div className="w-full pl-8">
                <div className="h-1.5 w-full rounded-full overflow-hidden mb-2 bg-[var(--ke-bg-hover)]">
                    <div
                        className="h-full transition-all duration-300 ease-out rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: 'var(--ke-accent)' }}
                    />
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[11px] tabular-nums" style={{ color: 'var(--ke-text-tertiary)' }}>
                        {progress.bytes_total > 0
                          ? `${formatSize(progress.bytes_done)} / ${formatSize(progress.bytes_total)} (${pct}%)`
                          : `${progress.current} items processed`
                        }
                    </span>
                    <button
                        onClick={cancelOperation}
                        className="text-[11px] px-2 py-0.5 rounded transition-colors font-medium hover:bg-[var(--ke-bg-hover)]"
                        style={{ color: 'var(--ke-error)' }}
                    >
                        Cancel
                    </button>
                </div>
              </div>
            );
        })()}
      </div>
    </div>
  );
};
