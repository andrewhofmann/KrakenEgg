import { useEffect, useRef, useState } from "react";
import { useStore } from "../store";
import { X } from "lucide-react";

export const InputModal = () => {
  const { show, title, message, initialValue, onConfirm } = useStore((state) => state.inputModal);
  const closeInputModal = useStore((state) => state.closeInputModal);
  
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (show) {
      setValue(initialValue || "");
      // Focus logic needs a slight delay or useEffect dependency tweak sometimes
      setTimeout(() => {
          if (inputRef.current) {
              inputRef.current.focus();
              inputRef.current.select();
          }
      }, 10);
    }
  }, [show, initialValue]);

  const handleConfirm = () => {
    onConfirm(value);
    closeInputModal();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      closeInputModal();
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 backdrop-blur-sm bg-black/50">
      <div className="relative flex flex-col w-full max-w-md rounded-lg shadow-2xl bg-macos-glass border border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button onClick={closeInputModal} className="p-1 rounded-md hover:bg-white/10 text-macos-textSecondary hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4">
          <p className="text-sm text-macos-text">{message}</p>
          <input 
            ref={inputRef}
            type="text" 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-black/20 border border-white/10 rounded-md py-2 px-3 text-sm text-white focus:outline-none focus:border-macos-active transition-all"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-3 border-t border-white/10 bg-white/5">
          <button 
            onClick={closeInputModal}
            className="px-4 py-1.5 text-xs font-medium text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            className="px-4 py-1.5 text-xs font-medium text-white bg-macos-active hover:bg-macos-activeHover rounded-md transition-colors shadow-sm"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
