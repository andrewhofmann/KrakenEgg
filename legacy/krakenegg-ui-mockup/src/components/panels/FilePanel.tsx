import React from 'react';
import { PanelState } from '../../types';
import PanelHeader from './PanelHeader';
import TabBar from './TabBar';
import DirectoryPath from './DirectoryPath';
import FileList from './FileList';
import PanelFooter from './PanelFooter';

interface FilePanelProps {
  side: 'left' | 'right';
  panel: PanelState;
  isActive: boolean;
  onUpdatePanel: (updater: (panel: PanelState) => PanelState) => void;
  onSwitchPanel: () => void;
  onShowDialog: (dialogId: string) => void;
}

const FilePanel: React.FC<FilePanelProps> = ({
  side,
  panel,
  isActive,
  onUpdatePanel,
  onSwitchPanel,
  onShowDialog
}) => {
  return (
    <div
      className={`flex-1 flex flex-col min-w-0 ${
        isActive
          ? 'ring-2 ring-macos-blue ring-inset'
          : 'opacity-90'
      }`}
      onClick={!isActive ? onSwitchPanel : undefined}
    >
      <PanelHeader
        side={side}
        panel={panel}
        isActive={isActive}
        onUpdatePanel={onUpdatePanel}
        onShowDialog={onShowDialog}
      />

      <TabBar
        side={side}
        panel={panel}
        onUpdatePanel={onUpdatePanel}
      />

      <DirectoryPath
        side={side}
        panel={panel}
        onUpdatePanel={onUpdatePanel}
      />

      <FileList
        side={side}
        panel={panel}
        isActive={isActive}
        onUpdatePanel={onUpdatePanel}
        onShowDialog={onShowDialog}
      />

      <PanelFooter
        side={side}
        panel={panel}
        onUpdatePanel={onUpdatePanel}
      />
    </div>
  );
};

export default FilePanel;