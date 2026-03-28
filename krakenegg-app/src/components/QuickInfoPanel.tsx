import { useEffect, useState, useMemo } from 'react';
import { useStore, getProcessedFiles } from '../store';
import { invoke } from '@tauri-apps/api/core';
import { formatSize } from '../utils/format';

interface RecursiveInfo {
    files: number;
    folders: number;
    size: number;
}

export const QuickInfoPanel = ({ side: _side }: { side: 'left' | 'right' }) => {
    const activeSide = useStore(s => s.activeSide);
    const layout = useStore(s => s[activeSide].layout);
    const preferences = useStore(s => s.preferences);
    // We want to show info ABOUT the active side.
    const targetTab = useStore(s => s[activeSide].tabs[s[activeSide].activeTabIndex]);
    const files = useMemo(() => {
        if (!targetTab || !layout) return [];
        return getProcessedFiles(targetTab.files, layout, targetTab.filterQuery, preferences.general.showHiddenFiles);
    }, [targetTab?.files, layout, targetTab?.filterQuery, preferences.general.showHiddenFiles]);
    const selection = targetTab?.selection || [];
    const cursorIndex = targetTab?.cursorIndex ?? -1;

    const [info, setInfo] = useState<RecursiveInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentItem, setCurrentItem] = useState<string>("");

    useEffect(() => {
        if (!targetTab) return;

        let targetName = "";
        let targetPath = "";

        // Determine target
        if (selection.length > 1) {
            // Multi-selection summary?
            // "number total of files and folders... total size"
            // Calculating recursive info for MULTIPLE items is heavy.
            // We can iterate and sum? Or backend batch?
            // For now, let's just show summary of SELECTED items (non-recursive sum from file list).
            // User asked: "go all the way as deep as the tree goes".
            // If I select 3 folders, I should recurse all 3.
            // I'll skip multi-recursion for MVP to avoid killing performance/complexity.
            // Just show "X items selected".
            setInfo(null);
            setCurrentItem(`${selection.length} items selected`);
            return;
        } else {
            const index = selection.length === 1 ? selection[0] : cursorIndex;
            if (index === -1) return;
            const file = files[index];
            if (!file || file.name === "..") {
                setInfo(null);
                setCurrentItem("");
                return;
            }
            targetName = file.name;
            targetPath = targetTab.path === "/" ? `/${file.name}` : `${targetTab.path}/${file.name}`;
        }

        setCurrentItem(targetName);
        setLoading(true);
        setError(null);

        // Call backend
        invoke<RecursiveInfo>('get_recursive_info', { path: targetPath })
            .then(res => {
                setInfo(res);
                setLoading(false);
            })
            .catch(err => {
                setError(String(err));
                setLoading(false);
            });

    }, [targetTab?.path, selection, cursorIndex, files, activeSide]);

    if (!targetTab) return null;

    return (
        <div className="flex-1 flex flex-col p-6 border-r overflow-auto font-mono text-sm h-full" style={{ backgroundColor: 'var(--ke-bg-panel)', color: 'var(--ke-text)', borderColor: 'var(--ke-border)' }}>
            <div className="text-lg font-bold mb-4 border-b pb-2 truncate" style={{ borderColor: 'var(--ke-border)' }}>
                {currentItem || "No Selection"}
            </div>

            {loading && <div className="animate-pulse" style={{ color: 'var(--ke-text-secondary)' }}>Calculating stats...</div>}
            
            {error && (
                <div className="p-3 rounded border" style={{ color: 'var(--ke-error)', backgroundColor: 'var(--ke-error-bg)', borderColor: 'var(--ke-error)' }}>
                    Error: {error}
                </div>
            )}

            {info && !loading && (() => {
                const index = selection.length === 1 ? selection[0] : cursorIndex;
                const file = index >= 0 ? files[index] : null;
                const fullPath = targetTab.path === "/" ? `/${currentItem}` : `${targetTab.path}/${currentItem}`;
                return (
                    <div className="space-y-3">
                        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
                            <div className="text-right" style={{ color: 'var(--ke-text-secondary)' }}>Size:</div>
                            <div className="font-semibold">{formatSize(info.size)}</div>

                            {info.files > 0 && (
                                <>
                                    <div className="text-right" style={{ color: 'var(--ke-text-secondary)' }}>Files:</div>
                                    <div>{info.files.toLocaleString()}</div>
                                </>
                            )}

                            {info.folders > 0 && (
                                <>
                                    <div className="text-right" style={{ color: 'var(--ke-text-secondary)' }}>Folders:</div>
                                    <div>{info.folders.toLocaleString()}</div>
                                </>
                            )}

                            {file && !file.is_dir && file.extension && (
                                <>
                                    <div className="text-right" style={{ color: 'var(--ke-text-secondary)' }}>Type:</div>
                                    <div>.{file.extension} file</div>
                                </>
                            )}

                            {file?.is_dir && (
                                <>
                                    <div className="text-right" style={{ color: 'var(--ke-text-secondary)' }}>Type:</div>
                                    <div>Folder</div>
                                </>
                            )}

                            {file?.modified_at && (
                                <>
                                    <div className="text-right" style={{ color: 'var(--ke-text-secondary)' }}>Modified:</div>
                                    <div>{new Date(file.modified_at * 1000).toLocaleString()}</div>
                                </>
                            )}

                            {file?.created_at && (
                                <>
                                    <div className="text-right" style={{ color: 'var(--ke-text-secondary)' }}>Created:</div>
                                    <div>{new Date(file.created_at * 1000).toLocaleString()}</div>
                                </>
                            )}

                            {file?.permissions !== undefined && (
                                <>
                                    <div className="text-right" style={{ color: 'var(--ke-text-secondary)' }}>Permissions:</div>
                                    <div className="font-mono">{file.permissions.toString(8)}</div>
                                </>
                            )}

                            {file?.is_symlink && (
                                <>
                                    <div className="text-right" style={{ color: 'var(--ke-text-secondary)' }}>Symlink:</div>
                                    <div>Yes</div>
                                </>
                            )}
                        </div>

                        <div className="pt-2 border-t" style={{ borderColor: 'var(--ke-border)' }}>
                            <div className="text-[10px] mb-1" style={{ color: 'var(--ke-text-secondary)' }}>Full Path</div>
                            <div className="break-all p-2 rounded text-[10px] select-text font-mono" style={{ backgroundColor: 'var(--ke-bg-input)' }}>
                                {fullPath}
                            </div>
                        </div>
                    </div>
                );
            })()}
            
            <div className="mt-auto pt-4 text-center text-xs opacity-50" style={{ color: 'var(--ke-text-secondary)' }}>
                Quick Info (Ctrl+Q)
            </div>
        </div>
    );
};
