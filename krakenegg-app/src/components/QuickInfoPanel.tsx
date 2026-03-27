import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { invoke } from '@tauri-apps/api/core';
import { formatSize } from '../utils/format';

interface RecursiveInfo {
    files: number;
    folders: number;
    size: number;
}

export const QuickInfoPanel = ({ side: _side }: { side: 'left' | 'right' }) => {
    const activeSide = useStore(s => s.activeSide);
    // If this panel is active, we don't show info (FilePanel logic handles this, but safety check)
    // We want to show info ABOUT the active side.
    const targetTab = useStore(s => s[activeSide].tabs[s[activeSide].activeTabIndex]);
    const files = targetTab?.files || [];
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
        <div className="flex-1 flex flex-col bg-black/40 text-white p-6 border-r border-macos-border overflow-auto font-mono text-sm h-full">
            <div className="text-lg font-bold mb-4 border-b border-white/10 pb-2 truncate">
                {currentItem || "No Selection"}
            </div>

            {loading && <div className="text-macos-textSecondary animate-pulse">Calculating stats...</div>}
            
            {error && (
                <div className="text-red-400 bg-red-900/20 p-3 rounded border border-red-500/20">
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
                            <div className="text-macos-textSecondary text-right">Size:</div>
                            <div className="font-semibold">{formatSize(info.size)}</div>

                            {info.files > 0 && (
                                <>
                                    <div className="text-macos-textSecondary text-right">Files:</div>
                                    <div>{info.files.toLocaleString()}</div>
                                </>
                            )}

                            {info.folders > 0 && (
                                <>
                                    <div className="text-macos-textSecondary text-right">Folders:</div>
                                    <div>{info.folders.toLocaleString()}</div>
                                </>
                            )}

                            {file && !file.is_dir && file.extension && (
                                <>
                                    <div className="text-macos-textSecondary text-right">Type:</div>
                                    <div>.{file.extension} file</div>
                                </>
                            )}

                            {file?.is_dir && (
                                <>
                                    <div className="text-macos-textSecondary text-right">Type:</div>
                                    <div>Folder</div>
                                </>
                            )}

                            {file?.modified_at && (
                                <>
                                    <div className="text-macos-textSecondary text-right">Modified:</div>
                                    <div>{new Date(file.modified_at * 1000).toLocaleString()}</div>
                                </>
                            )}

                            {file?.created_at && (
                                <>
                                    <div className="text-macos-textSecondary text-right">Created:</div>
                                    <div>{new Date(file.created_at * 1000).toLocaleString()}</div>
                                </>
                            )}

                            {file?.permissions !== undefined && (
                                <>
                                    <div className="text-macos-textSecondary text-right">Permissions:</div>
                                    <div className="font-mono">{file.permissions.toString(8)}</div>
                                </>
                            )}

                            {file?.is_symlink && (
                                <>
                                    <div className="text-macos-textSecondary text-right">Symlink:</div>
                                    <div>Yes</div>
                                </>
                            )}
                        </div>

                        <div className="pt-2 border-t border-white/10">
                            <div className="text-[10px] text-macos-textSecondary mb-1">Full Path</div>
                            <div className="break-all bg-black/20 p-2 rounded text-[10px] select-text font-mono">
                                {fullPath}
                            </div>
                        </div>
                    </div>
                );
            })()}
            
            <div className="mt-auto pt-4 text-center text-xs text-macos-textSecondary opacity-50">
                Quick Info (Ctrl+Q)
            </div>
        </div>
    );
};
