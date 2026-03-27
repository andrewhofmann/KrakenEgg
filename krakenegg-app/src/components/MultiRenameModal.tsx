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

    // Advanced: regex and case conversion
    const [regexFind, setRegexFind] = useState('');
    const [regexReplace, setRegexReplace] = useState('');
    const [caseConvert, setCaseConvert] = useState<string>('');

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
                counterWidth: Number(counterWidth),
                regexFind: regexFind || null,
                regexReplace: regexFind ? regexReplace : null,
                caseConvert: caseConvert || null,
            })
            .then(result => { setPreviews(result); setError(null); })
            .catch(err => setError(String(err)));
        }, 300);
        return () => clearTimeout(timer);
    }, [show, files, namePattern, extPattern, counterStart, counterStep, counterWidth, regexFind, regexReplace, caseConvert]);

    const handleExecute = async () => {
        try {
            await invoke('execute_mrt', {
                files, namePattern, extPattern,
                counterStart: Number(counterStart),
                counterStep: Number(counterStep),
                counterWidth: Number(counterWidth),
                regexFind: regexFind || null,
                regexReplace: regexFind ? regexReplace : null,
                caseConvert: caseConvert || null,
            });
            refreshPanel(activeSide);
            closeMultiRename();
        } catch (err) {
            setError(String(err));
        }
    };

    if (!show) return null;

    const hasChanges = previews.some(p => p.status === 'ok');
    const hasErrors = previews.some(p => p.status === 'error');

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans">
            <div className="w-full max-w-4xl bg-[var(--ke-bg-elevated)] border border-[var(--ke-border)] rounded-lg shadow-2xl flex flex-col max-h-[80vh] text-sm text-[var(--ke-text)]">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-[var(--ke-border)] bg-[var(--ke-bg-secondary)]">
                    <h3 className="font-bold text-lg">Multi-Rename Tool</h3>
                    <button onClick={closeMultiRename} className="p-1 hover:bg-[var(--ke-bg-hover)] rounded" aria-label="Close"><X size={18} /></button>
                </div>

                {/* Toolbar */}
                <div className="p-4 space-y-4 border-b border-[var(--ke-border)] bg-[var(--ke-bg-secondary)]">
                    {/* Pattern row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-xs text-[var(--ke-text-secondary)] font-medium uppercase">Name Pattern</label>
                            <input value={namePattern} onChange={e => setNamePattern(e.target.value)} className="w-full bg-[var(--ke-bg-input)] border border-[var(--ke-border)] rounded px-2 py-1.5 focus:border-[var(--ke-accent)] outline-none" />
                            <div className="flex gap-2">
                                <button onClick={() => setNamePattern(p => p + '[N]')} className="px-2 py-1 bg-[var(--ke-bg-hover)] border border-[var(--ke-border)] rounded text-xs hover:bg-[var(--ke-bg-active)] transition-colors">[N] Name</button>
                                <button onClick={() => setNamePattern(p => p + '[C]')} className="px-2 py-1 bg-[var(--ke-bg-hover)] border border-[var(--ke-border)] rounded text-xs hover:bg-[var(--ke-bg-active)] transition-colors">[C] Counter</button>
                                <button onClick={() => setNamePattern(p => p + '[YMD]')} className="px-2 py-1 bg-[var(--ke-bg-hover)] border border-[var(--ke-border)] rounded text-xs hover:bg-[var(--ke-bg-active)] transition-colors">[YMD] Date</button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs text-[var(--ke-text-secondary)] font-medium uppercase">Extension Pattern</label>
                            <input value={extPattern} onChange={e => setExtPattern(e.target.value)} className="w-full bg-[var(--ke-bg-input)] border border-[var(--ke-border)] rounded px-2 py-1.5 focus:border-[var(--ke-accent)] outline-none" />
                            <button onClick={() => setExtPattern(p => p + '[E]')} className="px-2 py-1 bg-[var(--ke-bg-hover)] border border-[var(--ke-border)] rounded text-xs hover:bg-[var(--ke-bg-active)] transition-colors">[E] Extension</button>
                        </div>
                    </div>

                    {/* Counter row */}
                    <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[var(--ke-border-subtle)]">
                        <div>
                            <label className="block text-xs text-[var(--ke-text-secondary)] mb-1">Start at</label>
                            <input type="number" value={counterStart} onChange={e => setCounterStart(parseInt(e.target.value) || 1)} className="w-full bg-[var(--ke-bg-input)] border border-[var(--ke-border)] rounded px-2 py-1" />
                        </div>
                        <div>
                            <label className="block text-xs text-[var(--ke-text-secondary)] mb-1">Step by</label>
                            <input type="number" value={counterStep} onChange={e => setCounterStep(parseInt(e.target.value) || 1)} className="w-full bg-[var(--ke-bg-input)] border border-[var(--ke-border)] rounded px-2 py-1" />
                        </div>
                        <div>
                            <label className="block text-xs text-[var(--ke-text-secondary)] mb-1">Digits</label>
                            <input type="number" value={counterWidth} onChange={e => setCounterWidth(parseInt(e.target.value) || 1)} className="w-full bg-[var(--ke-bg-input)] border border-[var(--ke-border)] rounded px-2 py-1" />
                        </div>
                    </div>

                    {/* Regex & Case row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[var(--ke-border-subtle)]">
                        <div>
                            <label className="block text-xs text-[var(--ke-text-secondary)] mb-1">Regex Find</label>
                            <input
                                value={regexFind}
                                onChange={e => setRegexFind(e.target.value)}
                                placeholder="e.g. (\d{4})_(\d{2})"
                                className="w-full bg-[var(--ke-bg-input)] border border-[var(--ke-border)] rounded px-2 py-1 font-mono text-xs placeholder:text-[var(--ke-text-disabled)] focus:border-[var(--ke-accent)] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-[var(--ke-text-secondary)] mb-1">Regex Replace</label>
                            <input
                                value={regexReplace}
                                onChange={e => setRegexReplace(e.target.value)}
                                placeholder="e.g. $1-$2"
                                disabled={!regexFind}
                                className="w-full bg-[var(--ke-bg-input)] border border-[var(--ke-border)] rounded px-2 py-1 font-mono text-xs placeholder:text-[var(--ke-text-disabled)] focus:border-[var(--ke-accent)] outline-none disabled:opacity-30 disabled:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-[var(--ke-text-secondary)] mb-1">Case</label>
                            <select
                                value={caseConvert}
                                onChange={e => setCaseConvert(e.target.value)}
                                className="w-full bg-[var(--ke-bg-input)] border border-[var(--ke-border)] rounded px-2 py-1.5 text-xs focus:border-[var(--ke-accent)] outline-none"
                            >
                                <option value="">No change</option>
                                <option value="upper">UPPERCASE</option>
                                <option value="lower">lowercase</option>
                                <option value="title">Title Case</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Preview List */}
                <div className="flex-1 overflow-auto p-0 bg-[var(--ke-bg-panel)]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--ke-bg-secondary)] sticky top-0 text-xs text-[var(--ke-text-secondary)] font-medium">
                            <tr>
                                <th className="p-2 pl-4 border-b border-[var(--ke-border)] w-1/2">Original Name</th>
                                <th className="p-2 border-b border-[var(--ke-border)] w-1/2">New Name</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {previews.map((p, i) => (
                                <tr key={i} className={clsx("border-b border-[var(--ke-border-subtle)] transition-colors", p.status === 'error' ? "bg-[var(--ke-error-bg)] hover:bg-[var(--ke-error-bg)]" : "hover:bg-[var(--ke-bg-hover)]")}>
                                    <td className="p-2 pl-4 truncate max-w-xs text-[var(--ke-text-secondary)]">{p.original}</td>
                                    <td className={clsx("p-2 truncate max-w-xs font-mono", p.status === 'error' ? "text-[var(--ke-error)]" : p.status === 'ok' && p.original !== p.new ? "text-[var(--ke-success)]" : "text-[var(--ke-text-tertiary)]")}>
                                        {p.new} {p.error && <span className="text-[var(--ke-error)] text-xs ml-2">{p.error}</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[var(--ke-border)] flex items-center gap-3 bg-[var(--ke-bg-secondary)]">
                    {error && <span className="text-[var(--ke-error)] mr-auto text-sm truncate">{error}</span>}
                    <span className="text-xs text-[var(--ke-text-tertiary)] mr-auto">
                        {previews.length} file{previews.length !== 1 ? 's' : ''}
                        {hasChanges && ` · ${previews.filter(p => p.status === 'ok').length} will change`}
                    </span>
                    <button onClick={closeMultiRename} className="px-4 py-2 rounded bg-[var(--ke-bg-hover)] hover:bg-[var(--ke-bg-active)] text-sm transition-colors">Cancel</button>
                    <button
                        onClick={handleExecute}
                        disabled={!hasChanges || hasErrors}
                        className="px-4 py-2 bg-[var(--ke-accent)] hover:bg-[var(--ke-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed rounded font-bold text-sm flex items-center shadow-lg transition-all transform active:scale-95"
                    >
                        <Play size={14} className="mr-2 fill-current" /> Start Rename
                    </button>
                </div>
            </div>
        </div>
    );
};
