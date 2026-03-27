import React, { useEffect } from 'react';
import { useFileSystemStore } from '../../stores/useFileSystemStore';

const TauriTest: React.FC = () => {
  const {
    leftPanelListing,
    systemInfo,
    isLoadingLeft,
    leftPanelError,
    loadSystemInfo,
    goToHome
  } = useFileSystemStore();

  useEffect(() => {
    // Load system info and navigate to home directory on mount
    const initialize = async () => {
      await loadSystemInfo();
      await goToHome('left');
    };

    initialize();
  }, [loadSystemInfo, goToHome]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Tauri Backend Test</h1>

      {/* System Info Section */}
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">System Information</h2>
        {systemInfo ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Platform:</strong> {systemInfo.platform}
            </div>
            <div>
              <strong>Architecture:</strong> {systemInfo.arch}
            </div>
            <div>
              <strong>Version:</strong> {systemInfo.version}
            </div>
            <div>
              <strong>Home Directory:</strong> {systemInfo.home_directory}
            </div>
            <div>
              <strong>CPU Count:</strong> {systemInfo.cpu_count}
            </div>
            <div>
              <strong>Current Directory:</strong> {systemInfo.current_directory}
            </div>
          </div>
        ) : (
          <div>Loading system information...</div>
        )}
      </div>

      {/* File Listing Section */}
      <div className="mb-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">File Listing</h2>

        {isLoadingLeft && (
          <div className="text-blue-600 mb-4">Loading files...</div>
        )}

        {leftPanelError && (
          <div className="text-red-600 mb-4 p-3 bg-red-100 rounded">
            Error: {leftPanelError}
          </div>
        )}

        {leftPanelListing && (
          <div>
            <div className="mb-4">
              <strong>Current Path:</strong> {leftPanelListing.path}
            </div>
            <div className="mb-4">
              <strong>Summary:</strong> {leftPanelListing.file_count} files, {leftPanelListing.directory_count} directories
            </div>

            <div className="max-h-96 overflow-y-auto border rounded">
              <table className="w-full">
                <thead className="bg-gray-200 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Size</th>
                    <th className="text-left p-2">Modified</th>
                  </tr>
                </thead>
                <tbody>
                  {leftPanelListing.files.slice(0, 20).map((file) => (
                    <tr key={file.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="flex items-center">
                          <span className="mr-2">
                            {file.is_directory ? '📁' : '📄'}
                          </span>
                          {file.name}
                        </div>
                      </td>
                      <td className="p-2">
                        {file.is_directory ? 'Directory' : file.extension || 'File'}
                      </td>
                      <td className="p-2">
                        {file.is_directory ? '-' : formatBytes(file.size)}
                      </td>
                      <td className="p-2">
                        {new Date(file.modified).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {leftPanelListing.files.length > 20 && (
                <div className="p-2 text-gray-600 text-center">
                  ... and {leftPanelListing.files.length - 20} more files
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Test Status */}
      <div className="p-4 bg-green-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-2 text-green-800">
          Integration Status
        </h2>
        <div className="text-green-700">
          {systemInfo && leftPanelListing
            ? '✅ Tauri backend integration successful!'
            : '⏳ Testing backend connection...'}
        </div>
      </div>
    </div>
  );
};

// Helper function to format file sizes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default TauriTest;