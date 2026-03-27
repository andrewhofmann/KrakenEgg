import React from 'react';
import { useFileSystemStore } from '../../stores/useFileSystemStore';
import { FileInfo } from '../../lib/tauri';

interface FilePanelProps {
  side: 'left' | 'right';
}

const FilePanel: React.FC<FilePanelProps> = ({ side }) => {
  const {
    leftPanelListing,
    rightPanelListing,
    isLoadingLeft,
    isLoadingRight,
    leftPanelError,
    rightPanelError,
    leftPanelSelected,
    rightPanelSelected,
    navigateLeftPanel,
    navigateRightPanel,
    selectFileLeft,
    selectFileRight,
  } = useFileSystemStore();

  const listing = side === 'left' ? leftPanelListing : rightPanelListing;
  const isLoading = side === 'left' ? isLoadingLeft : isLoadingRight;
  const error = side === 'left' ? leftPanelError : rightPanelError;
  const selected = side === 'left' ? leftPanelSelected : rightPanelSelected;
  const navigate = side === 'left' ? navigateLeftPanel : navigateRightPanel;
  const selectFile = side === 'left' ? selectFileLeft : selectFileRight;

  const handleDoubleClick = async (file: FileInfo) => {
    if (file.is_directory) {
      await navigate(file.path);
    }
  };

  const handleFileClick = (file: FileInfo) => {
    selectFile(file.id);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300">
      {/* Header */}
      <div className="bg-gray-100 border-b border-gray-300 p-2">
        <div className="font-medium text-sm">
          {listing?.path || 'Loading...'}
        </div>
        {listing && (
          <div className="text-xs text-gray-600">
            {listing.file_count} files, {listing.directory_count} directories
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="flex items-center justify-center h-32">
            <div className="text-blue-600">Loading...</div>
          </div>
        )}

        {error && (
          <div className="p-3 m-3 bg-red-100 border border-red-300 rounded text-red-700">
            Error: {error}
          </div>
        )}

        {listing && !isLoading && (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="text-left p-2 w-8"></th>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2 w-20">Size</th>
                <th className="text-left p-2 w-24">Date</th>
              </tr>
            </thead>
            <tbody>
              {/* Parent directory */}
              {listing.path !== '/' && (
                <tr
                  className="hover:bg-blue-50 cursor-pointer border-b border-gray-100"
                  onDoubleClick={() => {
                    const parentPath = listing.path.split('/').slice(0, -1).join('/') || '/';
                    navigate(parentPath);
                  }}
                >
                  <td className="p-2">📁</td>
                  <td className="p-2 font-medium">..</td>
                  <td className="p-2">-</td>
                  <td className="p-2">-</td>
                </tr>
              )}

              {/* Files and directories */}
              {listing.files.map((file) => (
                <tr
                  key={file.id}
                  className={`hover:bg-blue-50 cursor-pointer border-b border-gray-100 ${
                    selected.has(file.id) ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => handleFileClick(file)}
                  onDoubleClick={() => handleDoubleClick(file)}
                >
                  <td className="p-2">
                    {file.is_directory ? '📁' : '📄'}
                  </td>
                  <td className="p-2">
                    <div className="flex items-center">
                      <span className={file.is_directory ? 'font-medium' : ''}>
                        {file.name}
                      </span>
                      {file.extension && !file.is_directory && (
                        <span className="ml-1 text-gray-500 text-xs">
                          .{file.extension}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-2 text-right">
                    {file.is_directory ? '-' : formatBytes(file.size)}
                  </td>
                  <td className="p-2 text-gray-600">
                    {formatDate(file.modified)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Status bar */}
      <div className="bg-gray-100 border-t border-gray-300 p-1 text-xs text-gray-600">
        {listing && (
          <div className="flex justify-between">
            <span>{selected.size} selected</span>
            <span>
              Total: {formatBytes(listing.total_size)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilePanel;