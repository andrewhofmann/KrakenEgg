// Integration test to verify frontend-backend communication
// This test verifies that the Tauri commands can be invoked from the frontend

const { invoke } = require('@tauri-apps/api/core');

async function testBackendIntegration() {
  console.log('🦑 Starting integration test...');

  try {
    // Test get_home_directory command
    console.log('🦑 Testing get_home_directory command...');
    const homeDir = await invoke('get_home_directory');
    console.log('🦑 Home directory:', homeDir);

    // Test list_directory command on home directory
    console.log('🦑 Testing list_directory command...');
    const listing = await invoke('list_directory', { path: homeDir });
    console.log('🦑 Directory listing:', {
      path: listing.path,
      fileCount: listing.file_count,
      directoryCount: listing.directory_count,
      totalSize: listing.total_size,
      filesFound: listing.files.length
    });

    // Test get_file_info command on first file
    if (listing.files.length > 0) {
      const firstFile = listing.files[0];
      console.log('🦑 Testing get_file_info command...');
      const fileInfo = await invoke('get_file_info', { path: firstFile.path });
      console.log('🦑 File info:', {
        name: fileInfo.name,
        isDirectory: fileInfo.is_directory,
        size: fileInfo.size
      });
    }

    console.log('🦑 All integration tests passed! ✅');
    return true;

  } catch (error) {
    console.error('🦑 Integration test failed:', error);
    return false;
  }
}

// Run the test
testBackendIntegration();