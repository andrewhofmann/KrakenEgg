import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useStore, FileInfo } from "../store";

export function usePanelData(side: "left" | "right") {
  const activeTabIndex = useStore((state) => state[side].activeTabIndex);
  const activeTab = useStore((state) => state[side].tabs[activeTabIndex]);

  const setFiles = useStore((state) => state.setFiles);
  const setLoading = useStore((state) => state.setLoading);
  const setError = useStore((state) => state.setError);

  const path = activeTab?.path;
  const refreshVersion = activeTab?.refreshVersion;
  const tabId = activeTab?.id;

  useEffect(() => {
    if (!path) return;

    let mounted = true;

    const load = async (showLoading = true) => {
      if (showLoading) {
        setLoading(side, true);
      }

      try {
        const result = await invoke<FileInfo[]>("list_directory", { path });
        if (!mounted) return;

        // Diff check to prevent unnecessary re-renders (flicker)
        const currentFiles = useStore.getState()[side].tabs[activeTabIndex]?.files || [];
        let changed = false;

        if (result.length !== currentFiles.length) {
            changed = true;
        } else {
            for (let i = 0; i < result.length; i++) {
                const a = result[i];
                const b = currentFiles[i];
                if (
                    a.name !== b.name ||
                    a.size !== b.size ||
                    a.modified_at !== b.modified_at ||
                    a.is_dir !== b.is_dir
                ) {
                    changed = true;
                    break;
                }
            }
        }

        if (changed) {
            setFiles(side, result);
        } else if (showLoading) {
            setLoading(side, false);
        }
      } catch (err) {
        if (mounted) {
          setError(side, String(err));
          setLoading(side, false);
        }
      }
    };

    load(true); // Initial load

    // Set up filesystem watcher for live updates
    let unwatchFn: (() => void) | null = null;
    let unlistenFn: (() => void) | null = null;
    let cleanedUp = false;

    const setupWatcher = async () => {
      try {
        if (cleanedUp) return; // Already unmounted, don't register listeners
        await invoke("watch_directory", { path });

        if (cleanedUp) return; // Check again after await
        const unlisten = await listen<string>("directory-changed", (event) => {
          if (event.payload === path && mounted) {
            load(false);
          }
        });

        if (cleanedUp) { unlisten(); return; } // Cleanup if unmounted during await
        unlistenFn = unlisten;

        unwatchFn = () => {
          invoke("unwatch_directory", { path }).catch(() => {});
        };
      } catch {
        if (cleanedUp) return;
        const interval = setInterval(() => load(false), 3000);
        unwatchFn = () => clearInterval(interval);
      }
    };

    setupWatcher();

    return () => {
        mounted = false;
        cleanedUp = true;
        if (unlistenFn) unlistenFn();
        if (unwatchFn) unwatchFn();
        // Always unwatch the path even if setupWatcher hasn't completed yet
        // (prevents leaked watchers when navigating rapidly)
        invoke("unwatch_directory", { path }).catch(() => {});
    };
  }, [path, refreshVersion, tabId, side, setFiles, setLoading, setError, activeTabIndex]);
}
