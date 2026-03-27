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
        <div className={clsx(
            "fixed bottom-0 right-4 w-96 bg-[#1e1e1e]/95 backdrop-blur-xl border border-white/10 rounded-t-lg shadow-2xl transition-all duration-300 z-[200] overflow-hidden text-white font-sans",
            expanded ? "h-auto max-h-[400px]" : "h-9"
        )}>
            {/* Header */}
            <div 
                className="h-9 flex items-center justify-between px-3 bg-white/5 border-b border-white/5 cursor-pointer hover:bg-white/10 select-none"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center space-x-2 text-xs font-semibold">
                    <Activity size={13} className={runningOps.length > 0 ? "text-blue-400 animate-pulse" : "text-gray-400"} />
                    <span>{runningOps.length} Active, {fileOperations.length} Total</span>
                </div>
                {expanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronUp size={14} className="text-gray-400" />}
            </div>

            {/* List */}
            {expanded && (
                <div className="overflow-y-auto max-h-[360px] p-2 space-y-2">
                    {fileOperations.map(op => (
                        <div key={op.id} className="p-3 bg-black/20 rounded-md border border-white/5 text-xs">
                            <div className="flex justify-between items-start mb-2">
                                <div className="font-medium text-white truncate pr-2 flex-1" title={op.description}>
                                    {op.type.toUpperCase()}: {op.description}
                                </div>
                                <div className="flex items-center space-x-1">
                                    {op.status === 'completed' || op.status === 'error' ? (
                                        <button 
                                            onClick={() => removeFileOperation(op.id)}
                                            className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                                            title="Dismiss"
                                        >
                                            <X size={12} />
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => cancelFileOperation(op.id)}
                                            className="p-1 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"
                                            title="Cancel"
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {op.error ? (
                                <div className="text-red-400 flex items-center mb-1">
                                    <AlertCircle size={12} className="mr-1" />
                                    {op.error}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] text-gray-400">
                                        <span className="truncate max-w-[200px]" title={op.currentPath}>
                                            {op.status === 'completed' ? 'Done' : op.currentPath || 'Preparing...'}
                                        </span>
                                        <span className="tabular-nums">
                                            {op.status === 'completed' ? (
                                                <span className="text-green-400">Complete</span>
                                            ) : op.total > 0 ? (
                                                `${op.current}/${op.total} items · ${Math.round((op.current / op.total) * 100)}%`
                                            ) : (
                                                `${op.current} items`
                                            )}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className={clsx(
                                                "h-full transition-all duration-300 ease-out",
                                                op.status === 'completed' ? "bg-green-500" : "bg-blue-500"
                                            )}
                                            style={{ width: `${op.status === 'completed' ? 100 : (op.current / (op.total || 1)) * 100}%` }}
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
