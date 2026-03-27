import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileInfo } from '../../types';
import { formatFileSize, formatDate, getFileIcon } from '../../utils/fileUtils';
import {
  Download,
  Share,
  Edit,
  Code,
  Image as ImageIcon,
  FileText,
  Music,
  Video,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Eye
} from 'lucide-react';

interface UltraFileViewerProps {
  onClose: () => void;
  fileData?: FileInfo;
}

const UltraFileViewer = ({ onClose, fileData }: UltraFileViewerProps) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState<'preview' | 'info' | 'hex'>('preview');

  if (!fileData) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">📄</div>
        <h3 className="text-lg font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark mb-2">
          No file selected
        </h3>
        <p className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
          Select a file to view its contents
        </p>
      </div>
    );
  }

  const isImage = fileData.extension && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileData.extension.toLowerCase());
  const isText = fileData.extension && ['txt', 'md', 'json', 'js', 'ts', 'tsx', 'jsx', 'css', 'html'].includes(fileData.extension.toLowerCase());
  const isVideo = fileData.extension && ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(fileData.extension.toLowerCase());
  const isAudio = fileData.extension && ['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(fileData.extension.toLowerCase());

  const renderPreview = () => {
    if (isImage) {
      return (
        <div className="flex-1 flex items-center justify-center bg-mac26-bg-tertiary-light dark:bg-mac26-bg-tertiary-dark rounded-xl overflow-hidden">
          <motion.div
            className="relative max-w-full max-h-full"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={`https://picsum.photos/800/600?random=${fileData.id}`}
              alt={fileData.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          </motion.div>
        </div>
      );
    }

    if (isText) {
      return (
        <div className="flex-1 bg-mac26-bg-tertiary-light dark:bg-mac26-bg-tertiary-dark rounded-xl p-6 overflow-auto">
          <pre className="text-sm font-mono text-mac26-text-primary-light dark:text-mac26-text-primary-dark whitespace-pre-wrap">
            {`// Sample content for ${fileData.name}
function exampleFunction() {
  console.log("This is a preview of the file content");
  return "File content would be displayed here";
}

// Additional content...
const data = {
  fileName: "${fileData.name}",
  size: "${formatFileSize(fileData.size)}",
  modified: "${formatDate(fileData.modified)}"
};`}
          </pre>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="flex-1 flex items-center justify-center bg-mac26-bg-tertiary-light dark:bg-mac26-bg-tertiary-dark rounded-xl">
          <div className="text-center space-y-4">
            <Video size={64} className="mx-auto text-mac26-blue-500" />
            <div>
              <h4 className="text-lg font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                Video Preview
              </h4>
              <p className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
                {fileData.name}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="flex-1 flex items-center justify-center bg-mac26-bg-tertiary-light dark:bg-mac26-bg-tertiary-dark rounded-xl">
          <div className="text-center space-y-4">
            <Music size={64} className="mx-auto text-mac26-green-500" />
            <div>
              <h4 className="text-lg font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                Audio Preview
              </h4>
              <p className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
                {fileData.name}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex items-center justify-center bg-mac26-bg-tertiary-light dark:bg-mac26-bg-tertiary-dark rounded-xl">
        <div className="text-center space-y-4">
          <span className="text-6xl">{getFileIcon(fileData)}</span>
          <div>
            <h4 className="text-lg font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
              {fileData.name}
            </h4>
            <p className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
              No preview available
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderInfo = () => (
    <div className="flex-1 space-y-6 p-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-mac26-text-primary-light dark:text-mac26-text-primary-dark uppercase tracking-wide">
            File Information
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">Name</label>
              <div className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                {fileData.name}
              </div>
            </div>
            <div>
              <label className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">Size</label>
              <div className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                {formatFileSize(fileData.size)}
              </div>
            </div>
            <div>
              <label className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">Type</label>
              <div className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                {fileData.extension?.toUpperCase() || 'Unknown'}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-mac26-text-primary-light dark:text-mac26-text-primary-dark uppercase tracking-wide">
            Dates
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">Modified</label>
              <div className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                {formatDate(fileData.modified)}
              </div>
            </div>
            <div>
              <label className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">Created</label>
              <div className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                {formatDate(fileData.created || fileData.modified)}
              </div>
            </div>
            <div>
              <label className="text-xs text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">Accessed</label>
              <div className="text-sm font-medium text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
                {formatDate(fileData.accessed || fileData.modified)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[80vh] max-h-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getFileIcon(fileData)}</span>
          <div>
            <h3 className="text-lg font-semibold text-mac26-text-primary-light dark:text-mac26-text-primary-dark">
              {fileData.name}
            </h3>
            <p className="text-sm text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark">
              {formatFileSize(fileData.size)} • {formatDate(fileData.modified)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode tabs */}
          <div className="flex bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark rounded-lg p-1">
            {[
              { id: 'preview', icon: Eye, label: 'Preview' },
              { id: 'info', icon: FileText, label: 'Info' }
            ].map(tab => (
              <motion.button
                key={tab.id}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150 flex items-center gap-1.5 ${
                  viewMode === tab.id
                    ? 'bg-mac26-blue-500 text-white'
                    : 'text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark'
                }`}
                onClick={() => setViewMode(tab.id as any)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <tab.icon size={12} />
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <motion.button
              className="p-2 rounded-lg bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark transition-colors duration-150"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Download"
            >
              <Download size={14} />
            </motion.button>
            <motion.button
              className="p-2 rounded-lg bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark transition-colors duration-150"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Share"
            >
              <Share size={14} />
            </motion.button>
            <motion.button
              className="p-2 rounded-lg bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark transition-colors duration-150"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Edit"
            >
              <Edit size={14} />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {viewMode === 'preview' ? renderPreview() : renderInfo()}
      </div>

      {/* Footer controls for images */}
      {isImage && viewMode === 'preview' && (
        <div className="flex items-center justify-between p-4 bg-mac26-bg-secondary-light dark:bg-mac26-bg-secondary-dark border-t border-mac26-border-secondary-light dark:border-mac26-border-secondary-dark">
          <div className="flex items-center gap-2">
            <motion.button
              className="p-2 rounded-lg hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark transition-colors duration-150"
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Zoom out"
            >
              <ZoomOut size={14} />
            </motion.button>
            <span className="text-sm font-mono text-mac26-text-secondary-light dark:text-mac26-text-secondary-dark px-2">
              {zoom}%
            </span>
            <motion.button
              className="p-2 rounded-lg hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark transition-colors duration-150"
              onClick={() => setZoom(Math.min(400, zoom + 25))}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Zoom in"
            >
              <ZoomIn size={14} />
            </motion.button>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              className="p-2 rounded-lg hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark transition-colors duration-150"
              onClick={() => setRotation((rotation + 90) % 360)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Rotate"
            >
              <RotateCw size={14} />
            </motion.button>
            <motion.button
              className="p-2 rounded-lg hover:bg-mac26-hover-light dark:hover:bg-mac26-hover-dark transition-colors duration-150"
              onClick={() => {
                setZoom(100);
                setRotation(0);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Reset view"
            >
              <Maximize2 size={14} />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UltraFileViewer;