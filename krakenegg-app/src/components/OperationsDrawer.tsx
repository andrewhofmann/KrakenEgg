import { useStore } from '../store';
import { X, ChevronUp, ChevronDown, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { formatSize } from '../utils/format';
import clsx from 'clsx';

export const OperationsDrawer = () => {
    const fileOperations = useStore(s => s.fileOperations);
    const removeFileOperation = useStore(s => s.removeFileOperation);
    const cancelFileOperation = useStore(s => s.cancelFileOperation);
    const [expanded, setExpanded] = useState(true);

    if (fileOperations.length === 0) return null;

    const runningOps = fileOperations.filter(op => op.status === 'running' || op.status === 'pending');
    
    return (
        <div
            className={clsx(
                "fixed bottom-0 right-4 w-96 backdrop-blur-xl rounded-t-lg transition-all duration-300 z-[200] overflow-hidden font-sans",
                expanded ? "h-auto max-h-[400px]" : "h-9"
            )}
            style={{ backgroundColor: 'var(--ke-bg-elevated)', border: '1px solid var(--ke-border)', color: 'var(--ke-text)', boxShadow: 'var(--ke-shadow)' }}
        >
            {/* Header */}
            <div 
                className="h-9 flex items-center justify-between px-3 cursor-pointer select-none"
                style={{ backgroundColor: 'var(--ke-bg-hover)', borderBottom: '1px solid var(--ke-border-subtle)' }}
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center space-x-2 text-xs font-semibold">
                    <Activity size={13} className={runningOps.length > 0 ? "animate-pulse" : ""} style={{ color: runningOps.length > 0 ? 'var(--ke-accent)' : 'var(--ke-text-secondary)' }} />
                    <span>{runningOps.length} Active, {fileOperations.length} Total</span>
                </div>
                {expanded ? <ChevronDown size={14} style={{ color: 'var(--ke-text-secondary)' }} /> : <ChevronUp size={14} style={{ color: 'var(--ke-text-secondary)' }} />}
            </div>

            {/* List */}
            {expanded && (
                <div className="overflow-y-auto max-h-[360px] p-2 space-y-2">
                    {fileOperations.map(op => (
                        <div key={op.id} className="p-3 rounded-md text-xs" style={{ backgroundColor: 'var(--ke-bg-input)', border: '1px solid var(--ke-border-subtle)' }}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="font-medium truncate pr-2 flex-1" style={{ color: 'var(--ke-text)' }} title={op.currentPath || op.type}>
                                    {op.type.toUpperCase()}{op.currentPath ? `: ${op.currentPath}` : ''}
                                </div>
                                <div className="flex items-center space-x-1">
                                    {op.status === 'completed' || op.status === 'error' ? (
                                        <button
                                            onClick={() => removeFileOperation(op.id)}
                                            className="p-1 rounded"
                                            style={{ color: 'var(--ke-text-secondary)' }}
                                            title="Dismiss"
                                        >
                                            <X size={12} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => cancelFileOperation(op.id)}
                                            className="p-1 rounded"
                                            style={{ color: 'var(--ke-text-secondary)' }}
                                            title="Cancel"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {op.error ? (
                                <div className="flex items-center mb-1" style={{ color: 'var(--ke-error)' }}>
                                    <AlertCircle size={12} className="mr-1" />
                                    {op.error}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px]" style={{ color: 'var(--ke-text-secondary)' }}>
                                        <span className="truncate max-w-[200px]" title={op.currentPath}>
                                            {op.status === 'completed' ? 'Done' : op.currentPath || 'Preparing...'}
                                        </span>
                                        <span className="tabular-nums">
                                            {op.status === 'completed' ? (
                                                <span style={{ color: 'var(--ke-success)' }}>Complete</span>
                                            ) : op.total > 0 ? (
                                                `${op.current}/${op.total} items · ${Math.round((op.current / op.total) * 100)}%`
                                            ) : (
                                                `${op.current} items`
                                            )}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ke-bg-hover)' }}>
                                        <div
                                            className="h-full transition-all duration-300 ease-out"
                                            style={{ backgroundColor: op.status === 'completed' ? 'var(--ke-success)' : 'var(--ke-accent)', width: `${op.status === 'completed' ? 100 : (op.current / (op.total || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
