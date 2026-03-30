import { useEffect, useState, useRef } from 'react';
import { useStore } from '../store';
import { invoke } from '@tauri-apps/api/core';
import { X, Play, RotateCcw, ChevronDown, ChevronRight, Hash, Type, Replace, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

interface RenamePreview {
    original: string;
    new: string;
    status: string;
    error?: string;
}

const TokenButton = ({ token, label, onClick }: { token: string; label: string; onClick: () => void }) => (
    <button
        onClick={onClick}
        className="group flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all hover:bg-[var(--ke-accent)] hover:text-white"
        style={{ backgroundColor: 'var(--ke-bg-hover)', color: 'var(--ke-text-secondary)' }}
        title={`Insert ${token} — ${label}`}
    >
        <code className="font-mono font-bold text-[10px] px-1 py-0.5 rounded" style={{ backgroundColor: 'var(--ke-bg-active)' }}>{token}</code>
        <span className="hidden sm:inline">{label}</span>
    </button>
);

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
    const [regexFind, setRegexFind] = useState('');
    const [regexReplace, setRegexReplace] = useState('');
    const [caseConvert, setCaseConvert] = useState<string>('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [previews, setPreviews] = useState<RenamePreview[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [executing, setExecuting] = useState(false);

    const nameInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus name input on open
    useEffect(() => {
        if (show) {
            setTimeout(() => nameInputRef.current?.focus(), 100);
        }
    }, [show]);

    // Live preview with debounce
    useEffect(() => {
        if (!show || files.length === 0) return;
        const timer = setTimeout(() => {
            invoke<RenamePreview[]>('preview_mrt', {
                files, namePattern, extPattern,
                counterStart: Number(counterStart),
                counterStep: Number(counterStep),
                counterWidth: Number(counterWidth),
                regexFind: regexFind || null,
                regexReplace: regexFind ? regexReplace : null,
                caseConvert: caseConvert || null,
            })
            .then(result => { setPreviews(result); setError(null); })
            .catch(err => setError(String(err)));
        }, 200);
        return () => clearTimeout(timer);
    }, [show, files, namePattern, extPattern, counterStart, counterStep, counterWidth, regexFind, regexReplace, caseConvert]);

    const handleExecute = async () => {
        if (executing) return;
        setExecuting(true);
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
            useStore.getState().refreshPanel(activeSide);
            closeMultiRename();
        } catch (err) {
            setError(String(err));
        } finally {
            setExecuting(false);
        }
    };

    const handleReset = () => {
        setNamePattern('[N]');
        setExtPattern('[E]');
        setCounterStart(1);
        setCounterStep(1);
        setCounterWidth(1);
        setRegexFind('');
        setRegexReplace('');
        setCaseConvert('');
        setShowAdvanced(false);
    };

    const insertToken = (setter: React.Dispatch<React.SetStateAction<string>>, token: string) => {
        setter(prev => prev + token);
    };

    if (!show) return null;

    const changedCount = previews.filter(p => p.status === 'ok' && p.original !== p.new).length;
    const errorCount = previews.filter(p => p.status === 'error').length;
    const unchangedCount = previews.filter(p => p.status === 'unchanged' || (p.status === 'ok' && p.original === p.new)).length;
    const hasChanges = changedCount > 0;
    const hasErrors = errorCount > 0;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm font-sans">
            <div
                className="w-full max-w-5xl flex flex-col rounded-xl shadow-2xl overflow-hidden"
                style={{ backgroundColor: 'var(--ke-bg-elevated)', border: '1px solid var(--ke-border)', maxHeight: '85vh' }}
            >
                {/* ─── HEADER ─────────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ backgroundColor: 'var(--ke-bg-secondary)', borderBottom: '1px solid var(--ke-border)' }}>
                    <div className="flex items-center gap-3">
                        <Replace size={18} style={{ color: 'var(--ke-accent)' }} />
                        <h2 className="text-base font-bold" style={{ color: 'var(--ke-text)' }}>Multi-Rename Tool</h2>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--ke-bg-hover)', color: 'var(--ke-text-tertiary)' }}>
                            {files.length} file{files.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors"
                            style={{ color: 'var(--ke-text-secondary)' }}
                            title="Reset all fields"
                        >
                            <RotateCcw size={12} /> Reset
                        </button>
                        <button onClick={closeMultiRename} className="p-1.5 rounded-md transition-colors hover:bg-[var(--ke-bg-hover)]" aria-label="Close">
                            <X size={16} style={{ color: 'var(--ke-text-secondary)' }} />
                        </button>
                    </div>
                </div>

                {/* ─── CONTROLS ───────────────────────────── */}
                <div className="px-5 py-4 space-y-4 shrink-0" style={{ borderBottom: '1px solid var(--ke-border)' }}>
                    {/* Name & Extension patterns side by side */}
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end">
                        {/* Name Pattern */}
                        <div>
                            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--ke-text-tertiary)' }}>
                                <Type size={11} /> Filename
                            </label>
                            <input
                                ref={nameInputRef}
                                value={namePattern}
                                onChange={e => setNamePattern(e.target.value)}
                                className="w-full font-mono text-sm rounded-md px-3 py-2 outline-none transition-colors"
                                style={{ backgroundColor: 'var(--ke-bg-input)', border: '1px solid var(--ke-border)', color: 'var(--ke-text)' }}
                                onFocus={e => e.target.select()}
                            />
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                <TokenButton token="[N]" label="Name" onClick={() => insertToken(setNamePattern, '[N]')} />
                                <TokenButton token="[C]" label="Counter" onClick={() => insertToken(setNamePattern, '[C]')} />
                                <TokenButton token="[YMD]" label="Date" onClick={() => insertToken(setNamePattern, '[YMD]')} />
                                <TokenButton token="[Y]" label="Year" onClick={() => insertToken(setNamePattern, '[Y]')} />
                            </div>
                        </div>

                        {/* Dot separator visual */}
                        <div className="flex items-center pb-8 text-lg font-bold" style={{ color: 'var(--ke-text-tertiary)' }}>.</div>

                        {/* Extension Pattern */}
                        <div>
                            <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--ke-text-tertiary)' }}>
                                Extension
                            </label>
                            <input
                                value={extPattern}
                                onChange={e => setExtPattern(e.target.value)}
                                className="w-full font-mono text-sm rounded-md px-3 py-2 outline-none transition-colors"
                                style={{ backgroundColor: 'var(--ke-bg-input)', border: '1px solid var(--ke-border)', color: 'var(--ke-text)' }}
                                onFocus={e => e.target.select()}
                            />
                            <div className="flex flex-wrap gap-1 mt-1.5">
                                <TokenButton token="[E]" label="Extension" onClick={() => insertToken(setExtPattern, '[E]')} />
                            </div>
                        </div>
                    </div>

                    {/* Counter row — always visible since [C] is common */}
                    <div className="flex items-end gap-3">
                        <Hash size={14} className="mb-2 shrink-0" style={{ color: 'var(--ke-text-tertiary)' }} />
                        <div className="flex-1">
                            <label className="block text-[10px] mb-0.5" style={{ color: 'var(--ke-text-tertiary)' }}>Start</label>
                            <input type="number" value={counterStart} onChange={e => setCounterStart(parseInt(e.target.value) || 1)}
                                className="w-full font-mono text-sm rounded-md px-2 py-1.5 outline-none"
                                style={{ backgroundColor: 'var(--ke-bg-input)', border: '1px solid var(--ke-border)', color: 'var(--ke-text)' }} />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] mb-0.5" style={{ color: 'var(--ke-text-tertiary)' }}>Step</label>
                            <input type="number" value={counterStep} onChange={e => setCounterStep(parseInt(e.target.value) || 1)}
                                className="w-full font-mono text-sm rounded-md px-2 py-1.5 outline-none"
                                style={{ backgroundColor: 'var(--ke-bg-input)', border: '1px solid var(--ke-border)', color: 'var(--ke-text)' }} />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] mb-0.5" style={{ color: 'var(--ke-text-tertiary)' }}>Digits</label>
                            <input type="number" value={counterWidth} onChange={e => setCounterWidth(parseInt(e.target.value) || 1)} min={1} max={10}
                                className="w-full font-mono text-sm rounded-md px-2 py-1.5 outline-none"
                                style={{ backgroundColor: 'var(--ke-bg-input)', border: '1px solid var(--ke-border)', color: 'var(--ke-text)' }} />
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] mb-0.5" style={{ color: 'var(--ke-text-tertiary)' }}>Case</label>
                            <select value={caseConvert} onChange={e => setCaseConvert(e.target.value)}
                                className="w-full text-sm rounded-md px-2 py-[7px] outline-none cursor-pointer"
                                style={{ backgroundColor: 'var(--ke-bg-input)', border: '1px solid var(--ke-border)', color: 'var(--ke-text)' }}>
                                <option value="">No change</option>
                                <option value="upper">UPPER</option>
                                <option value="lower">lower</option>
                                <option value="title">Title</option>
                            </select>
                        </div>
                    </div>

                    {/* Advanced section — collapsible */}
                    <div>
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider transition-colors"
                            style={{ color: 'var(--ke-text-tertiary)' }}
                        >
                            {showAdvanced ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            Regex Find & Replace
                        </button>
                        {showAdvanced && (
                            <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-end mt-2">
                                <div>
                                    <label className="block text-[10px] mb-0.5" style={{ color: 'var(--ke-text-tertiary)' }}>Find (regex)</label>
                                    <input
                                        value={regexFind} onChange={e => setRegexFind(e.target.value)}
                                        placeholder="(\d{4})_(\d{2})"
                                        className="w-full font-mono text-xs rounded-md px-2 py-1.5 outline-none placeholder:text-[var(--ke-text-disabled)]"
                                        style={{ backgroundColor: 'var(--ke-bg-input)', border: '1px solid var(--ke-border)', color: 'var(--ke-text)' }} />
                                </div>
                                <ArrowRight size={14} className="mb-2" style={{ color: 'var(--ke-text-tertiary)' }} />
                                <div>
                                    <label className="block text-[10px] mb-0.5" style={{ color: 'var(--ke-text-tertiary)' }}>Replace</label>
                                    <input
                                        value={regexReplace} onChange={e => setRegexReplace(e.target.value)}
                                        placeholder="$1-$2"
                                        disabled={!regexFind}
                                        className="w-full font-mono text-xs rounded-md px-2 py-1.5 outline-none placeholder:text-[var(--ke-text-disabled)] disabled:opacity-30"
                                        style={{ backgroundColor: 'var(--ke-bg-input)', border: '1px solid var(--ke-border)', color: 'var(--ke-text)' }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── PREVIEW TABLE ──────────────────────── */}
                <div className="flex-1 overflow-auto min-h-0" style={{ backgroundColor: 'var(--ke-bg-panel)' }}>
                    {previews.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--ke-text-tertiary)' }}>
                            Adjusting patterns above will show a live preview here
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse text-[13px]">
                            <thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--ke-bg-secondary)' }}>
                                <tr>
                                    <th className="py-1.5 px-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ke-text-tertiary)', borderBottom: '1px solid var(--ke-border)' }}>
                                        Original
                                    </th>
                                    <th className="py-1.5 px-1 text-center w-8" style={{ borderBottom: '1px solid var(--ke-border)' }}></th>
                                    <th className="py-1.5 px-4 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ke-text-tertiary)', borderBottom: '1px solid var(--ke-border)' }}>
                                        New Name
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {previews.map((p, i) => {
                                    const changed = p.status === 'ok' && p.original !== p.new;
                                    const isError = p.status === 'error';
                                    return (
                                        <tr
                                            key={i}
                                            className="transition-colors"
                                            style={{
                                                backgroundColor: isError ? 'var(--ke-error-bg)' : undefined,
                                                borderBottom: '1px solid var(--ke-border-subtle)',
                                            }}
                                        >
                                            <td className="py-1.5 px-4 truncate max-w-[300px]" style={{ color: 'var(--ke-text-secondary)' }}>
                                                {p.original}
                                            </td>
                                            <td className="py-1.5 px-1 text-center">
                                                {changed && <ArrowRight size={12} style={{ color: 'var(--ke-accent)' }} />}
                                                {isError && <X size={12} style={{ color: 'var(--ke-error)' }} />}
                                            </td>
                                            <td className={clsx("py-1.5 px-4 truncate max-w-[300px] font-mono")}>
                                                {isError ? (
                                                    <span style={{ color: 'var(--ke-error)' }}>{p.error || 'Error'}</span>
                                                ) : changed ? (
                                                    <span style={{ color: 'var(--ke-success)' }}>{p.new}</span>
                                                ) : (
                                                    <span style={{ color: 'var(--ke-text-disabled)' }}>{p.new}</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ─── FOOTER ─────────────────────────────── */}
                <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ backgroundColor: 'var(--ke-bg-secondary)', borderTop: '1px solid var(--ke-border)' }}>
                    <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--ke-text-tertiary)' }}>
                        {error ? (
                            <span style={{ color: 'var(--ke-error)' }} className="truncate max-w-[400px]">{error}</span>
                        ) : (
                            <>
                                {changedCount > 0 && <span style={{ color: 'var(--ke-success)' }}>{changedCount} will rename</span>}
                                {unchangedCount > 0 && <span>{unchangedCount} unchanged</span>}
                                {errorCount > 0 && <span style={{ color: 'var(--ke-error)' }}>{errorCount} error{errorCount !== 1 ? 's' : ''}</span>}
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={closeMultiRename}
                            className="px-4 py-2 rounded-md text-sm transition-colors"
                            style={{ backgroundColor: 'var(--ke-bg-hover)', color: 'var(--ke-text)' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExecute}
                            disabled={!hasChanges || hasErrors || executing}
                            className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                            style={{ backgroundColor: 'var(--ke-accent)', color: '#fff' }}
                        >
                            <Play size={13} className="fill-current" />
                            {executing ? 'Renaming...' : 'Rename'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
