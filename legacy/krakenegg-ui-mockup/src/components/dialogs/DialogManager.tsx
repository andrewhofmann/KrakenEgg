import React from 'react';
import { AppState } from '../../types';
import CopyDialog from './CopyDialog';
import DeleteDialog from './DeleteDialog';
import CreateDirectoryDialog from './CreateDirectoryDialog';
import CreateFileDialog from './CreateFileDialog';
import SearchDialog from './SearchDialog';
import ArchiveDialog from './ArchiveDialog';
import ExtractDialog from './ExtractDialog';
import SettingsDialog from './SettingsDialog';
import AboutDialog from './AboutDialog';
import KeyboardHelpDialog from './KeyboardHelpDialog';
import FileViewerDialog from './FileViewerDialog';

interface DialogManagerProps {
  activeDialog: string | null;
  appState: AppState;
  onClose: () => void;
  onUpdateAppState: (updater: (state: AppState) => AppState) => void;
}

const DialogManager: React.FC<DialogManagerProps> = ({
  activeDialog,
  appState,
  onClose,
  onUpdateAppState
}) => {
  if (!activeDialog) return null;

  const dialogProps = {
    appState,
    onClose,
    onUpdateAppState
  };

  switch (activeDialog) {
    case 'copy':
      return <CopyDialog {...dialogProps} />;

    case 'move':
      return <CopyDialog {...dialogProps} isMove={true} />;

    case 'delete':
      return <DeleteDialog {...dialogProps} />;

    case 'createDirectory':
      return <CreateDirectoryDialog {...dialogProps} />;

    case 'createFile':
      return <CreateFileDialog {...dialogProps} />;

    case 'search':
      return <SearchDialog {...dialogProps} />;

    case 'archive':
      return <ArchiveDialog {...dialogProps} />;

    case 'extract':
      return <ExtractDialog {...dialogProps} />;

    case 'settings':
      return <SettingsDialog {...dialogProps} />;

    case 'about':
      return <AboutDialog {...dialogProps} />;

    case 'keyboardHelp':
      return <KeyboardHelpDialog {...dialogProps} />;

    case 'view':
      return <FileViewerDialog {...dialogProps} />;

    default:
      console.warn('Unknown dialog:', activeDialog);
      return null;
  }
};

export default DialogManager;