import { useEffect, useState } from "react";
import clsx from "clsx";
import { X, Plus } from "lucide-react";
import { useStore, TabState } from "../store";
import { Reorder } from "framer-motion";

export const TabBar = ({ side }: { side: "left" | "right" }) => {
  const storeTabs = useStore(state => state[side].tabs);
  const activeTabIndex = useStore(state => state[side].activeTabIndex);
  const setActiveTab = useStore(state => state.setActiveTab);
  const setActiveSide = useStore(state => state.setActiveSide);
  const closeTab = useStore(state => state.closeTab);
  const addTab = useStore(state => state.addTab);
  const setTabs = useStore(state => state.setTabs);
  const moveTab = useStore(state => state.moveTab);
  const activePath = storeTabs[activeTabIndex]?.path;

  const [tabs, setLocalTabs] = useState(storeTabs);
  const [isDragging, setIsDragging] = useState(false); // Track dragging state

  // Sync state from store to local when store updates (e.g. new tab added externally)
  useEffect(() => {
    setLocalTabs(storeTabs);
  }, [storeTabs]);

  const handleReorder = (newOrder: TabState[]) => {
      setLocalTabs(newOrder);
      // To sync active index:
      // We need to find where the active tab went.
      const activeTabId = storeTabs[activeTabIndex]?.id;
      if (activeTabId) {
          const newIndex = newOrder.findIndex(t => t.id === activeTabId);
          if (newIndex !== -1 && newIndex !== activeTabIndex) {
              setActiveTab(side, newIndex);
          }
      }
      setTabs(side, newOrder);
  };

  return (
    <div 
        id={`tabbar-${side}`}
        className={clsx(
            "flex items-end h-8 bg-[var(--ke-bg-secondary)] px-1 space-x-1 shrink-0 relative",
            // If dragging, remove overflow clipping to allow tab to "escape" visually
            // Note: This works if content fits. If content scrolls, disabling overflow might expand container or hide scrollbar.
            // It's a tradeoff for the visual pop-out.
            isDragging ? "overflow-visible z-50" : "overflow-x-auto no-scrollbar"
        )}
    >
      <Reorder.Group 
        axis="x" 
        values={tabs} 
        onReorder={handleReorder} 
        className="flex items-end h-full space-x-1"
        role="tablist"
        aria-label={`${side} panel tabs`}
      >
        {tabs.map((tab, i) => {
            const isActive = tab.id === storeTabs[activeTabIndex]?.id;
            const tabName = tab.path === "/" ? "Root" : tab.path.split('/').pop() || "Shell";

            return (
            <Reorder.Item
                key={tab.id}
                value={tab}
                role="tab"
                aria-selected={isActive}
                aria-label={tabName}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={(_e, info) => {
                    setIsDragging(false);
                    if (tabs.length <= 1) return; // Prevent moving last tab

                    const otherSide = side === 'left' ? 'right' : 'left';
                    const otherPanel = document.querySelector(`[data-side="${otherSide}"]`);
                    if (otherPanel) {
                        const rect = otherPanel.getBoundingClientRect();
                        if (
                            info.point.x >= rect.left && 
                            info.point.x <= rect.right && 
                            info.point.y >= rect.top && 
                            info.point.y <= rect.bottom
                        ) {
                            // Dropped on other pane (anywhere)
                            moveTab(side, i, otherSide, undefined); // undefined toIndex = append
                        }
                    }
                }}
                onClick={(_e) => { 
                    // Prevent click triggering if dragging? Framer handles this usually.
                    // e.stopPropagation(); 
                    setActiveTab(side, i); 
                    setActiveSide(side); 
                }}
                className={clsx(
                "group flex items-center pl-3 pr-1.5 py-1 rounded-t-md text-xs cursor-default min-w-[80px] max-w-[150px] relative transition-colors border-t border-x",
                isActive
                    ? "z-10 border-[var(--ke-border)]"
                    : "bg-transparent border-transparent hover:bg-[var(--ke-bg-hover)]"
                )}
                // Framer motion props for style
                initial={false}
                whileDrag={{ scale: 1.05, opacity: 0.9, zIndex: 100 }}
            >
                <span className="truncate flex-1 pointer-events-none">{tabName}</span>
                <button
                aria-label={`Close ${tabName}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); closeTab(side, i); }}
                className={clsx(
                    "p-0.5 rounded hover:bg-[var(--ke-bg-active)] opacity-0 group-hover:opacity-100 transition-opacity ml-1",
                    isActive && "opacity-100" 
                )}
                >
                <X size={10} />
                </button>
                
                {/* Active Indicator Line */}
                {isActive && <div className="absolute bottom-0 left-1 right-1 h-[2px] rounded-full" style={{ backgroundColor: 'var(--ke-accent)' }} />}
            </Reorder.Item>
            );
        })}
      </Reorder.Group>
      
      {/* New Tab Button */}
      <button
        aria-label="New tab"
        onClick={(e) => {
          e.stopPropagation();
          addTab(side, activePath || "/");
        }}
        className="p-1 rounded mb-0.5 hover:bg-[var(--ke-bg-hover)]"
        style={{ color: 'var(--ke-text-secondary)' }}
      >
        <Plus size={12} />
      </button>
    </div>
  );
};
