import React, { useEffect, useRef, useLayoutEffect, useState } from 'react';
import clsx from 'clsx';

interface ContextMenuItem {
  label: string;
  action: () => void;
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: y, left: x });

  useLayoutEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let newTop = y;
      let newLeft = x;

      // Check vertical overflow
      if (y + rect.height > window.innerHeight) {
        newTop = Math.max(0, y - rect.height);
      }

      // Check horizontal overflow
      if (x + rect.width > window.innerWidth) {
        newLeft = Math.max(0, x - rect.width);
      }

      setPosition({ top: newTop, left: newLeft });
    }
  }, [x, y, items]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] min-w-[180px] bg-[#2C2C2C]/90 backdrop-blur-xl border border-white/15 rounded-lg shadow-2xl p-1 text-[13px] outline-none select-none"
      style={{ top: position.top, left: position.left }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, index) => {
        if (item.label === "---") {
            return <div key={index} className="h-px bg-white/10 my-1.5 mx-1" />;
        }

        return (
            <button
            key={index}
            className={clsx(
                "block w-full text-left px-3 py-1 rounded-[4px] transition-colors leading-tight truncate",
                item.disabled 
                ? "text-white/30 cursor-default" 
                : "text-white hover:bg-[#0058D0] hover:text-white cursor-default"
            )}
            onClick={() => {
                if (!item.disabled) {
                item.action();
                onClose();
                }
            }}
            disabled={item.disabled}
            >
            {item.label}
            </button>
        );
      })}
    </div>
  );
};
