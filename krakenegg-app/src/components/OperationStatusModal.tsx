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
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        hideOperationStatus();
      }, 3000); // Hide after 3 seconds
    } else if (progress || conflict) {
        // If progress or conflict, clear timer so it doesn't hide
        if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [show, isError, progress, conflict, hideOperationStatus]);

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-[250] max-w-md w-full p-4 pointer-events-none">
      <div 
        className={clsx(
          "bg-macos-glass border rounded-lg shadow-2xl p-4 flex flex-col gap-3 animate-in slide-in-from-right-4 fade-in duration-200 pointer-events-auto backdrop-blur-xl",
          isError ? "border-red-500/30 bg-red-900/40" : "border-white/15 bg-[#1e1e1e]/90"
        )}
      >
        <div className="flex items-center gap-3">
            {progress ? (
                <Loader2 size={20} className="text-blue-400 shrink-0 animate-spin" />
            ) : isError ? (
                <XCircle size={20} className="text-red-400 shrink-0" />
            ) : (
                <CheckCircle size={20} className="text-green-400 shrink-0" />
            )}
            
            <div className="flex-1 min-w-0 overflow-hidden">
                <div className={clsx("text-sm font-medium truncate", isError ? "text-red-200" : "text-white")}>
                    {message}
                </div>
                {progress && (
                    <div className="text-[11px] text-white/50 truncate mt-0.5" title={progress.path}>
                        {progress.path}
                    </div>
                )}
            </div>

            {!progress && (
                <button 
                onClick={hideOperationStatus} 
                className={clsx(
                    "p-1 rounded-md hover:bg-white/10 transition-colors shrink-0",
                    isError ? "text-red-300 hover:text-red-100" : "text-macos-textSecondary hover:text-white"
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
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                    <div
                        className="h-full bg-blue-500 transition-all duration-300 ease-out rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[11px] text-white/50 tabular-nums">
                        {progress.bytes_total > 0
                          ? `${formatSize(progress.bytes_done)} / ${formatSize(progress.bytes_total)} (${pct}%)`
                          : `${progress.current} items processed`
                        }
                    </span>
                    <button
                        onClick={cancelOperation}
                        className="text-[11px] text-red-300 hover:text-white hover:bg-red-500/20 px-2 py-0.5 rounded transition-colors font-medium"
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
