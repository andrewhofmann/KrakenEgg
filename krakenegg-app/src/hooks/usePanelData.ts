import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
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
    
    const load = async (isPolling = false) => {
      // Only show loading state if it's an initial load or manual refresh, not polling
      if (!isPolling) {
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
            // Shallow compare sufficient for display
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
        } else if (!isPolling) {
            // If manual refresh resulted in no change, we still need to clear loading state
            setLoading(side, false);
        }
      } catch (err) {
        if (mounted) setError(side, String(err));
      }
    };

    load(false); // Initial load
    
    const interval = setInterval(() => load(true), 2000); // Polling
    
    return () => { 
        mounted = false; 
        clearInterval(interval);
    };
  }, [path, refreshVersion, tabId, side, setFiles, setLoading, setError, activeTabIndex]);
}