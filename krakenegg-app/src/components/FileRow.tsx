import { memo, useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { FileInfo, SortColumn } from "../store";
import { SmartTooltip } from "./SmartTooltip";
import { formatSize, formatDate, getExtension } from "../utils/format";
import { getFileIcon, getFileIconColor } from "../utils/fileIcons";

interface FileRowProps {
  file: FileInfo;
  index: number;
  style: React.CSSProperties;
  isSelected: boolean;
  isCursor: boolean;
  isActive: boolean;
  isDragTarget: boolean;
  isRenaming?: boolean;
  columns: SortColumn[];

  onClick: (e: React.MouseEvent, index: number) => void;
  onDoubleClick: (e: React.MouseEvent, file: FileInfo) => void;
  onContextMenu: (e: React.MouseEvent, file: FileInfo, index: number) => void;
  onDragStart: (e: React.DragEvent, file: FileInfo, index: number) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, index: number, file: FileInfo) => void;
  onDragLeave: (e: React.DragEvent, file: FileInfo) => void;
  onDrop: (e: React.DragEvent, file: FileInfo) => void;
  onRenameSubmit?: (oldName: string, newName: string) => void;
  onRenameCancel?: () => void;
}

export const FileRow = memo(({
  file, index, style,
  isSelected, isCursor, isActive, isDragTarget, isRenaming, columns,
  onClick, onDoubleClick, onContextMenu, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
  onRenameSubmit, onRenameCancel
}: FileRowProps) => {
  const [renameValue, setRenameValue] = useState(file.name);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      setRenameValue(file.name);
      renameInputRef.current.focus();
      // Select the name without extension
      const dotIndex = file.name.lastIndexOf('.');
      if (dotIndex > 0 && !file.is_dir) {
        renameInputRef.current.setSelectionRange(0, dotIndex);
      } else {
        renameInputRef.current.select();
      }
    }
  }, [isRenaming, file.name, file.is_dir]);

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = renameValue.trim();
      if (trimmed && trimmed !== file.name) {
        onRenameSubmit?.(file.name, trimmed);
      } else {
        onRenameCancel?.();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onRenameCancel?.();
    }
  };

  const gridTemplate = columns.map(c => `var(--col-${c})`).join(' ');

  const mergedStyle = {
      ...style,
      display: 'grid',
      gridTemplateColumns: gridTemplate,
      paddingLeft: '12px',
      paddingRight: '12px',
  };

  const textColorClass = isSelected && isActive
      ? "text-white/90"
      : "text-[var(--ke-text-secondary)]";

  const renderCell = (col: SortColumn) => {
      switch (col) {
          case 'name': {
              const Icon = getFileIcon(file);
              const iconColor = getFileIconColor(file, isSelected, isActive);
              return (
                  <div className="flex items-center overflow-hidden min-w-0 pr-2 h-full text-left">
                      <Icon size={15} className={clsx("mr-2 shrink-0", iconColor, file.is_dir && "fill-current")} />
                      {isRenaming ? (
                        <input
                          ref={renameInputRef}
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={handleRenameKeyDown}
                          onBlur={() => onRenameCancel?.()}
                          className="flex-1 min-w-0 rounded px-1 py-0 text-[inherit] outline-none"
                          style={{ backgroundColor: 'var(--ke-bg-input)', border: '1px solid var(--ke-accent)', color: 'var(--ke-text)' }}
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          <SmartTooltip text={file.name} className="pt-0.5 min-w-0" />
                          {file.is_symlink && <span className="ml-1 text-[11px] shrink-0" style={{ color: 'var(--ke-text-tertiary)' }}>→</span>}
                        </>
                      )}
                  </div>
              );
          }
          case 'ext':
              return (
                  <div className={clsx("text-right tabular-nums h-full flex items-center justify-end overflow-hidden pr-2", textColorClass)}>
                      <SmartTooltip text={file.is_dir ? "" : (file.extension || getExtension(file.name))} className="pt-0.5" />
                  </div>
              );
          case 'size':
              return (
                  <div className={clsx("text-right tabular-nums h-full flex items-center justify-end overflow-hidden", textColorClass)}>
                      <SmartTooltip text={file.is_dir ? (file.size > 0 ? formatSize(file.size) : "<DIR>") : formatSize(file.size)} className="pt-0.5" />
                  </div>
              );
          case 'date':
              return (
                  <div className={clsx("text-right tabular-nums h-full flex items-center justify-end overflow-hidden", textColorClass)}>
                      <SmartTooltip text={formatDate(file.modified_at)} className="pt-0.5" />
                  </div>
              );
      }
  };

  return (
    <div
      style={mergedStyle}
      id={`row-${index}`}
      role="row"
      aria-selected={isSelected}
      aria-label={`${file.is_dir ? 'Folder' : 'File'}: ${file.name}`}
      tabIndex={isCursor ? 0 : -1}
      onClick={(e) => { e.stopPropagation(); if (!isRenaming) onClick(e, index); }}
      onDoubleClick={(e) => { e.stopPropagation(); if (!isRenaming) onDoubleClick(e, file); }}
      onContextMenu={(e) => { if (!isRenaming) onContextMenu(e, file, index); }}
      draggable={!isRenaming}
      onDragStart={(e) => onDragStart(e, file, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index, file)}
      onDragLeave={(e) => onDragLeave(e, file)}
      onDrop={(e) => onDrop(e, file)}
      className={clsx(
        "transition-colors font-normal select-none leading-none items-center border-b border-white/[0.03]",
        isSelected && isActive
          ? "bg-[var(--ke-selection)] text-white"
          : isActive ? "hover:bg-[var(--ke-bg-hover)]" : "opacity-70",

        isDragTarget && "bg-blue-500/20 ring-2 ring-blue-400 z-20 rounded",
        isCursor && isActive && !isDragTarget && !isSelected && "ring-1 ring-white/20 z-10"
      )}
    >
      {columns.map(col => (
          <div key={col} className="h-full overflow-hidden">
              {renderCell(col)}
          </div>
      ))}
    </div>
  );
});
