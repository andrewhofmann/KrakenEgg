import { memo } from "react";
import { Folder, File } from "lucide-react";
import clsx from "clsx";
import { FileInfo, SortColumn } from "../store";
import { SmartTooltip } from "./SmartTooltip";
import { formatSize, formatDate, getExtension } from "../utils/format";

interface FileRowProps {
  file: FileInfo;
  index: number;
  style: React.CSSProperties;
  isSelected: boolean;
  isCursor: boolean;
  isActive: boolean;
  isDragTarget: boolean;
  columns: SortColumn[]; // Dynamic order
  
  onClick: (e: React.MouseEvent, index: number) => void;
  onDoubleClick: (e: React.MouseEvent, file: FileInfo) => void;
  onContextMenu: (e: React.MouseEvent, file: FileInfo, index: number) => void;
  onDragStart: (e: React.DragEvent, file: FileInfo, index: number) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, index: number, file: FileInfo) => void;
  onDragLeave: (e: React.DragEvent, file: FileInfo) => void;
  onDrop: (e: React.DragEvent, file: FileInfo) => void;
}

export const FileRow = memo(({
  file, index, style, 
  isSelected, isCursor, isActive, isDragTarget, columns,
  onClick, onDoubleClick, onContextMenu, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop
}: FileRowProps) => {
  
  // Construct grid-template-columns dynamically based on order
  // e.g. var(--col-name) var(--col-size) ...
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
      : "text-gray-500";

  const renderCell = (col: SortColumn) => {
      switch (col) {
          case 'name':
              return (
                  <div className="flex items-center overflow-hidden min-w-0 pr-2 h-full text-left">
                      {file.is_dir ? (
                        <Folder size={15} className={clsx("mr-2 shrink-0 fill-current", isSelected && isActive ? "text-white" : "text-blue-400")} />
                      ) : (
                        <File size={15} className={clsx("mr-2 shrink-0", isSelected && isActive ? "text-white" : "text-gray-400")} />
                      )}
                      <SmartTooltip text={file.name} className="pt-0.5 min-w-0" />
                  </div>
              );
          case 'ext':
              return (
                  <div className={clsx("text-right tabular-nums h-full flex items-center justify-end overflow-hidden pr-2", textColorClass)}>
                      <SmartTooltip text={file.is_dir ? "" : getExtension(file.name)} className="pt-0.5" />
                  </div>
              );
          case 'size':
              return (
                  <div className={clsx("text-right tabular-nums h-full flex items-center justify-end overflow-hidden", textColorClass)}>
                      <SmartTooltip text={file.is_dir ? "--" : formatSize(file.size)} className="pt-0.5" />
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
      onClick={(e) => { e.stopPropagation(); onClick(e, index); }}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(e, file); }}
      onContextMenu={(e) => onContextMenu(e, file, index)}
      draggable="true"
      onDragStart={(e) => onDragStart(e, file, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index, file)}
      onDragLeave={(e) => onDragLeave(e, file)}
      onDrop={(e) => onDrop(e, file)}
      className={clsx(
        "border-b border-transparent transition-colors text-[13px] font-normal select-none leading-none items-center",
        isSelected && isActive
          ? "bg-[#0058D0] text-white" 
          : isActive ? "text-white hover:bg-white/5" : "text-gray-400",
        
        isDragTarget && "bg-blue-500/20 ring-1 ring-blue-500 z-20",
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
