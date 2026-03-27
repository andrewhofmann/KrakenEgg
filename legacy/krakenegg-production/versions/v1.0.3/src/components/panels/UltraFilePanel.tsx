import { useState } from 'react';
import { motion } from 'framer-motion';
import { PanelState } from '../../types';
import UltraTabHeaderBar from './UltraTabHeaderBar';
import UltraDirectoryPath from './UltraDirectoryPath';
import UltraFileList from './UltraFileList';

interface UltraFilePanelProps {
  side: 'left' | 'right';
  panel: PanelState;
  isActive: boolean;
  onUpdatePanel: (updater: (panel: PanelState) => PanelState) => void;
  onSwitchPanel: () => void;
  onShowDialog: (dialogId: string) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isDragTarget?: boolean;
}

const UltraFilePanel = ({
  side,
  panel,
  isActive,
  onUpdatePanel,
  onSwitchPanel,
  onShowDialog,
  onDragStart,
  onDragEnd,
  isDragging = false,
  isDragTarget = false
}: UltraFilePanelProps) => {
  const [isPathEditing, setIsPathEditing] = useState(false);
  return (
    <motion.div
      className={`w-full flex flex-col min-w-0 ultra-panel relative ring-2 ${
        isActive ? 'ring-mac26-blue-500 ring-opacity-30' : 'ring-transparent'
      } ${isDragTarget ? 'ring-4 ring-mac26-blue-500 ring-opacity-60' : ''} ${
        isDragging ? 'cursor-grabbing opacity-75' : !isPathEditing ? 'cursor-grab' : ''
      }`}
      onClick={!isActive ? onSwitchPanel : undefined}
      draggable={!isPathEditing}
      onDragStart={(e) => {
        console.log('Panel drag start:', side);
        if ('dataTransfer' in e && e.dataTransfer) {
          (e.dataTransfer as DataTransfer).effectAllowed = 'move';
          (e.dataTransfer as DataTransfer).setData('text/plain', side);
        }
        onDragStart?.();
      }}
      onDragEnd={(e) => {
        console.log('Panel drag end:', side);
        onDragEnd?.();
      }}
    >
      <div className="relative">
        <UltraTabHeaderBar
          side={side}
          panel={panel}
          isActive={isActive}
          onUpdatePanel={onUpdatePanel}
          onShowDialog={onShowDialog}
        />

        {/* Active panel indicator - always reserve space to prevent layout shift */}
        <div className="w-full h-1">
          {isActive && (
            <motion.div
              className="w-full h-full bg-gradient-to-r from-mac26-blue-500 to-mac26-purple-500"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          )}
        </div>
      </div>

      <UltraDirectoryPath
        side={side}
        panel={panel}
        onUpdatePanel={onUpdatePanel}
        onEditingChange={setIsPathEditing}
      />

      <div className="flex-1 min-h-0">
        <UltraFileList
          side={side}
          panel={panel}
          isActive={isActive}
          onUpdatePanel={onUpdatePanel}
          onShowDialog={onShowDialog}
        />
      </div>
    </motion.div>
  );
};

export default UltraFilePanel;