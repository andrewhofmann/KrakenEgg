import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import UltraFileViewer from './UltraFileViewer';
import UltraFileOperationDialog from './UltraFileOperationDialog';
import UltraSearchDialog from './UltraSearchDialog';
import UltraSettingsDialog from './UltraSettingsDialog';
import UltraDirectoryDialog from './UltraDirectoryDialog';
import UltraArchiveDialog from './UltraArchiveDialog';
import UltraNetworkDialog from './UltraNetworkDialog';

interface UltraDialogManagerProps {
  activeDialog: string | null;
  onCloseDialog: () => void;
  dialogData?: {
    files: any[];
    currentFile?: any;
  };
}

const UltraDialogManager = ({ activeDialog, onCloseDialog, dialogData }: UltraDialogManagerProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeDialog) {
        onCloseDialog();
      }
    };

    if (activeDialog) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeDialog, onCloseDialog]);

  const renderDialog = () => {
    switch (activeDialog) {
      case 'view':
        return <UltraFileViewer onClose={onCloseDialog} fileData={dialogData?.currentFile} />;
      case 'copy':
      case 'move':
      case 'delete':
        return <UltraFileOperationDialog type={activeDialog} onClose={onCloseDialog} data={{ files: dialogData?.files || [] }} />;
      case 'search':
        return <UltraSearchDialog onClose={onCloseDialog} />;
      case 'settings':
        return <UltraSettingsDialog onClose={onCloseDialog} />;
      case 'createDirectory':
        return <UltraDirectoryDialog onClose={onCloseDialog} />;
      case 'archive':
        return <UltraArchiveDialog onClose={onCloseDialog} data={{ files: dialogData?.files || [], mode: 'create' }} />;
      case 'network':
        return <UltraNetworkDialog onClose={onCloseDialog} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {activeDialog && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCloseDialog}
          />

          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderDialog()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UltraDialogManager;