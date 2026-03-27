import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { invoke } from '@tauri-apps/api/core';
import { X, Play } from 'lucide-react';
import clsx from 'clsx';

interface RenamePreview {
    original: string;
    new: string;
    status: string;
    error?: string;
}

export const MultiRenameModal = () => {
    const { show, files } = useStore(s => s.multiRename);
    const closeMultiRename = useStore(s => s.closeMultiRename);
    const refreshPanel = useStore(s => s.refreshPanel);
    const activeSide = useStore(s => s.activeSide);

    const [namePattern, setNamePattern] = useState('[N]');
    const [extPattern, setExtPattern] = useState('[E]');
    const [counterStart, setCounterStart] = useState(1);
    const [counterStep, setCounterStep] = useState(1);
    const [counterWidth, setCounterWidth] = useState(1);

    const [previews, setPreviews] = useState<RenamePreview[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!show || files.length === 0) return;
        
        const timer = setTimeout(() => {
            invoke<RenamePreview[]>('preview_mrt', {
                files,
                namePattern,
                extPattern,
                counterStart: Number(counterStart),
                counterStep: Number(counterStep),
                counterWidth: Number(counterWidth)
            })
            .then(setPreviews)
            .catch(err => setError(String(err)));
        }, 300);
        return () => clearTimeout(timer);
    }, [show, files, namePattern, extPattern, counterStart, counterStep, counterWidth]);

    const handleExecute = async () => {
        try {
            await invoke('execute_mrt', {
                files, namePattern, extPattern, 
                counterStart: Number(counterStart), 
                counterStep: Number(counterStep), 
                counterWidth: Number(counterWidth)
            });
            refreshPanel(activeSide);
            closeMultiRename();
        } catch (err) {
            setError(String(err));
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans">
            <div className="w-full max-w-4xl bg-[#1e1e1e] border border-white/10 rounded-lg shadow-2xl flex flex-col max-h-[80vh] text-sm text-white">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
                    <h3 className="font-bold text-lg">Multi-Rename Tool</h3>
                    <button onClick={closeMultiRename} className="p-1 hover:bg-white/10 rounded"><X size={18} /></button>
                </div>

                {/* Toolbar */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-white/10 bg-black/20">
                    <div className="space-y-2">
                        <label className="block text-xs text-gray-400 font-medium uppercase">Name Pattern</label>
                        <input value={namePattern} onChange={e => setNamePattern(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 focus:border-blue-500 outline-none" />
                        <div className="flex gap-2">
                            <button onClick={() => setNamePattern(p => p + '[N]')} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs hover:bg-white/10 transition-colors">[N] Name</button>
                            <button onClick={() => setNamePattern(p => p + '[C]')} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs hover:bg-white/10 transition-colors">[C] Counter</button>
                            <button onClick={() => setNamePattern(p => p + '[YMD]')} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs hover:bg-white/10 transition-colors">[YMD] Date</button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs text-gray-400 font-medium uppercase">Extension Pattern</label>
                        <input value={extPattern} onChange={e => setExtPattern(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded px-2 py-1.5 focus:border-blue-500 outline-none" />
                        <button onClick={() => setExtPattern(p => p + '[E]')} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs hover:bg-white/10 transition-colors">[E] Extension</button>
                    </div>
                    
                    <div className="md:col-span-2 grid grid-cols-3 gap-4 pt-2 border-t border-white/5">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Start at</label>
                            <input type="number" value={counterStart} onChange={e => setCounterStart(parseInt(e.target.value))} className="w-full bg-black/30 border border-white/10 rounded px-2 py-1" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Step by</label>
                            <input type="number" value={counterStep} onChange={e => setCounterStep(parseInt(e.target.value))} className="w-full bg-black/30 border border-white/10 rounded px-2 py-1" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Digits</label>
                            <input type="number" value={counterWidth} onChange={e => setCounterWidth(parseInt(e.target.value))} className="w-full bg-black/30 border border-white/10 rounded px-2 py-1" />
                        </div>
                    </div>
                </div>

                {/* Preview List */}
                <div className="flex-1 overflow-auto p-0 bg-black/40">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#2a2a2a] sticky top-0 text-xs text-gray-400 font-medium">
                            <tr>
                                <th className="p-2 pl-4 border-b border-white/10 w-1/2">Original Name</th>
                                <th className="p-2 border-b border-white/10 w-1/2">New Name</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {previews.map((p, i) => (
                                <tr key={i} className={clsx("border-b border-white/5 transition-colors", p.status === 'error' ? "bg-red-900/20 hover:bg-red-900/30" : "hover:bg-white/5")}>
                                    <td className="p-2 pl-4 truncate max-w-xs text-gray-300">{p.original}</td>
                                    <td className={clsx("p-2 truncate max-w-xs font-mono", p.status === 'error' ? "text-red-400" : p.status === 'ok' && p.original !== p.new ? "text-green-400" : "text-gray-500")}>
                                        {p.new} {p.error && <span className="text-red-400 text-xs ml-2">⚠️ {p.error}</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-[#2a2a2a]">
                    {error && <span className="text-red-400 mr-auto self-center text-sm">{error}</span>}
                    <button onClick={closeMultiRename} className="px-4 py-2 rounded hover:bg-white/10 text-sm transition-colors">Cancel</button>
                    <button onClick={handleExecute} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold text-sm flex items-center shadow-lg transition-all transform active:scale-95">
                        <Play size={14} className="mr-2 fill-current" /> Start Rename
                    </button>
                </div>
            </div>
        </div>
    );
};
