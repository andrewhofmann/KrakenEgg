import { FileInfo, FileType, FilePermissions } from '../types';

const createMockPermissions = (): FilePermissions => ({
  readable: true,
  writable: true,
  executable: false,
  owner: 'andrew',
  group: 'staff',
  mode: '644'
});

const createMockFile = (
  name: string,
  path: string,
  size: number,
  type: FileType,
  isDirectory: boolean = false,
  isHidden: boolean = false
): FileInfo => ({
  id: `${path}/${name}`,
  name,
  path,
  size,
  modified: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
  created: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
  isDirectory,
  isHidden,
  permissions: createMockPermissions(),
  extension: isDirectory ? undefined : name.split('.').pop(),
  type,
});

// Generate comprehensive mock file structure
export const generateMockFiles = (path: string): FileInfo[] => {
  const files: FileInfo[] = [];

  // Add parent directory if not root
  if (path !== '/') {
    files.push(createMockFile('..', path, 0, FileType.Directory, true));
  }

  switch (path) {
    case '/':
      return [
        createMockFile('Applications', '/', 0, FileType.Directory, true),
        createMockFile('System', '/', 0, FileType.Directory, true),
        createMockFile('Users', '/', 0, FileType.Directory, true),
        createMockFile('Library', '/', 0, FileType.Directory, true),
        createMockFile('Volumes', '/', 0, FileType.Directory, true),
        createMockFile('private', '/', 0, FileType.Directory, true),
        createMockFile('tmp', '/', 0, FileType.Directory, true),
        createMockFile('usr', '/', 0, FileType.Directory, true),
        createMockFile('var', '/', 0, FileType.Directory, true),
        createMockFile('bin', '/', 0, FileType.Directory, true),
        createMockFile('etc', '/', 0, FileType.Directory, true),
        createMockFile('sbin', '/', 0, FileType.Directory, true),
        createMockFile('.hidden', '/', 128, FileType.File, false, true),
        createMockFile('.DS_Store', '/', 6148, FileType.File, false, true),
      ];

    case '/Users':
      return [
        ...files,
        createMockFile('andrew', '/Users', 0, FileType.Directory, true),
        createMockFile('Shared', '/Users', 0, FileType.Directory, true),
        createMockFile('.localized', '/Users', 0, FileType.File, false, true),
      ];

    case '/Users/andrew':
      return [
        ...files,
        createMockFile('Desktop', '/Users/andrew', 0, FileType.Directory, true),
        createMockFile('Documents', '/Users/andrew', 0, FileType.Directory, true),
        createMockFile('Downloads', '/Users/andrew', 0, FileType.Directory, true),
        createMockFile('Pictures', '/Users/andrew', 0, FileType.Directory, true),
        createMockFile('Music', '/Users/andrew', 0, FileType.Directory, true),
        createMockFile('Movies', '/Users/andrew', 0, FileType.Directory, true),
        createMockFile('Applications', '/Users/andrew', 0, FileType.Directory, true),
        createMockFile('Library', '/Users/andrew', 0, FileType.Directory, true),
        createMockFile('Public', '/Users/andrew', 0, FileType.Directory, true),
        createMockFile('.bash_profile', '/Users/andrew', 245, FileType.Code, false, true),
        createMockFile('.zshrc', '/Users/andrew', 1024, FileType.Code, false, true),
        createMockFile('.gitconfig', '/Users/andrew', 312, FileType.File, false, true),
        createMockFile('.DS_Store', '/Users/andrew', 6148, FileType.File, false, true),
      ];

    case '/Users/andrew/Documents':
      return [
        ...files,
        createMockFile('Projects', '/Users/andrew/Documents', 0, FileType.Directory, true),
        createMockFile('Work', '/Users/andrew/Documents', 0, FileType.Directory, true),
        createMockFile('Personal', '/Users/andrew/Documents', 0, FileType.Directory, true),
        createMockFile('Archives', '/Users/andrew/Documents', 0, FileType.Directory, true),
        createMockFile('Resume.pdf', '/Users/andrew/Documents', 245760, FileType.Document),
        createMockFile('Project_Notes.md', '/Users/andrew/Documents', 5120, FileType.Document),
        createMockFile('Budget_2024.xlsx', '/Users/andrew/Documents', 52480, FileType.Document),
        createMockFile('Meeting_Recording.mp3', '/Users/andrew/Documents', 15728640, FileType.Audio),
        createMockFile('Screenshot.png', '/Users/andrew/Documents', 2048000, FileType.Image),
        createMockFile('backup.zip', '/Users/andrew/Documents', 104857600, FileType.Archive),
        createMockFile('temp.txt', '/Users/andrew/Documents', 1024, FileType.File),
      ];

    case '/Users/andrew/Documents/Projects':
      return [
        ...files,
        createMockFile('KrakenEgg', '/Users/andrew/Documents/Projects', 0, FileType.Directory, true),
        createMockFile('WebsiteRedesign', '/Users/andrew/Documents/Projects', 0, FileType.Directory, true),
        createMockFile('MobileApp', '/Users/andrew/Documents/Projects', 0, FileType.Directory, true),
        createMockFile('DataAnalysis', '/Users/andrew/Documents/Projects', 0, FileType.Directory, true),
        createMockFile('ClientWork', '/Users/andrew/Documents/Projects', 0, FileType.Directory, true),
        createMockFile('OpenSource', '/Users/andrew/Documents/Projects', 0, FileType.Directory, true),
        createMockFile('Experiments', '/Users/andrew/Documents/Projects', 0, FileType.Directory, true),
        createMockFile('README.md', '/Users/andrew/Documents/Projects', 2048, FileType.Document),
        createMockFile('project-ideas.txt', '/Users/andrew/Documents/Projects', 4096, FileType.File),
      ];

    case '/Users/andrew/Documents/Projects/KrakenEgg':
      return [
        ...files,
        createMockFile('src', '/Users/andrew/Documents/Projects/KrakenEgg', 0, FileType.Directory, true),
        createMockFile('docs', '/Users/andrew/Documents/Projects/KrakenEgg', 0, FileType.Directory, true),
        createMockFile('tests', '/Users/andrew/Documents/Projects/KrakenEgg', 0, FileType.Directory, true),
        createMockFile('node_modules', '/Users/andrew/Documents/Projects/KrakenEgg', 0, FileType.Directory, true),
        createMockFile('dist', '/Users/andrew/Documents/Projects/KrakenEgg', 0, FileType.Directory, true),
        createMockFile('package.json', '/Users/andrew/Documents/Projects/KrakenEgg', 2048, FileType.Code),
        createMockFile('package-lock.json', '/Users/andrew/Documents/Projects/KrakenEgg', 524288, FileType.Code),
        createMockFile('tsconfig.json', '/Users/andrew/Documents/Projects/KrakenEgg', 512, FileType.Code),
        createMockFile('vite.config.ts', '/Users/andrew/Documents/Projects/KrakenEgg', 256, FileType.Code),
        createMockFile('tailwind.config.js', '/Users/andrew/Documents/Projects/KrakenEgg', 1024, FileType.Code),
        createMockFile('README.md', '/Users/andrew/Documents/Projects/KrakenEgg', 8192, FileType.Document),
        createMockFile('FEATURES.md', '/Users/andrew/Documents/Projects/KrakenEgg', 16384, FileType.Document),
        createMockFile('ARCHITECTURE.md', '/Users/andrew/Documents/Projects/KrakenEgg', 12288, FileType.Document),
        createMockFile('.gitignore', '/Users/andrew/Documents/Projects/KrakenEgg', 512, FileType.File, false, true),
        createMockFile('.eslintrc.json', '/Users/andrew/Documents/Projects/KrakenEgg', 1024, FileType.Code, false, true),
      ];

    case '/Users/andrew/Downloads':
      return [
        ...files,
        createMockFile('Torrents', '/Users/andrew/Downloads', 0, FileType.Directory, true),
        createMockFile('Software', '/Users/andrew/Downloads', 0, FileType.Directory, true),
        createMockFile('Images', '/Users/andrew/Downloads', 0, FileType.Directory, true),
        createMockFile('Documents', '/Users/andrew/Downloads', 0, FileType.Directory, true),
        createMockFile('Chrome_Installer.dmg', '/Users/andrew/Downloads', 67108864, FileType.Archive),
        createMockFile('VSCode-darwin-universal.zip', '/Users/andrew/Downloads', 134217728, FileType.Archive),
        createMockFile('presentation.pptx', '/Users/andrew/Downloads', 5242880, FileType.Document),
        createMockFile('financial_report.pdf', '/Users/andrew/Downloads', 1048576, FileType.Document),
        createMockFile('vacation_photos.zip', '/Users/andrew/Downloads', 536870912, FileType.Archive),
        createMockFile('song.mp3', '/Users/andrew/Downloads', 8388608, FileType.Audio),
        createMockFile('movie_trailer.mp4', '/Users/andrew/Downloads', 104857600, FileType.Video),
        createMockFile('screenshot_2024.png', '/Users/andrew/Downloads', 2097152, FileType.Image),
        createMockFile('temp_file.tmp', '/Users/andrew/Downloads', 512, FileType.File),
        createMockFile('installer.pkg', '/Users/andrew/Downloads', 33554432, FileType.Executable),
      ];

    case '/Applications':
      return [
        ...files,
        createMockFile('Safari.app', '/Applications', 0, FileType.Executable, true),
        createMockFile('Chrome.app', '/Applications', 0, FileType.Executable, true),
        createMockFile('Firefox.app', '/Applications', 0, FileType.Executable, true),
        createMockFile('Visual Studio Code.app', '/Applications', 0, FileType.Executable, true),
        createMockFile('Xcode.app', '/Applications', 0, FileType.Executable, true),
        createMockFile('Finder.app', '/Applications', 0, FileType.Executable, true),
        createMockFile('Terminal.app', '/Applications', 0, FileType.Executable, true),
        createMockFile('Mail.app', '/Applications', 0, FileType.Executable, true),
        createMockFile('Calendar.app', '/Applications', 0, FileType.Executable, true),
        createMockFile('Photos.app', '/Applications', 0, FileType.Executable, true),
        createMockFile('Music.app', '/Applications', 0, FileType.Executable, true),
        createMockFile('TV.app', '/Applications', 0, FileType.Executable, true),
        createMockFile('Keynote.app', '/Applications', 0, FileType.Executable, true),
        createMockFile('Pages.app', '/Applications', 0, FileType.Executable, true),
        createMockFile('Numbers.app', '/Applications', 0, FileType.Executable, true),
        createMockFile('Utilities', '/Applications', 0, FileType.Directory, true),
      ];

    default:
      // Generate a variety of files for any unknown path
      return [
        ...files,
        createMockFile('folder1', path, 0, FileType.Directory, true),
        createMockFile('folder2', path, 0, FileType.Directory, true),
        createMockFile('folder3', path, 0, FileType.Directory, true),
        createMockFile('document.pdf', path, 1024000, FileType.Document),
        createMockFile('image.jpg', path, 2048000, FileType.Image),
        createMockFile('video.mp4', path, 52428800, FileType.Video),
        createMockFile('audio.mp3', path, 4194304, FileType.Audio),
        createMockFile('script.js', path, 8192, FileType.Code),
        createMockFile('styles.css', path, 4096, FileType.Code),
        createMockFile('data.json', path, 2048, FileType.Code),
        createMockFile('archive.zip', path, 10485760, FileType.Archive),
        createMockFile('text.txt', path, 1024, FileType.File),
        createMockFile('executable', path, 16384, FileType.Executable),
        createMockFile('link', path, 0, FileType.Link),
        createMockFile('.hidden_file', path, 512, FileType.File, false, true),
      ];
  }
};

// Mock archive contents
export const mockArchiveContents: { [key: string]: FileInfo[] } = {
  'backup.zip': [
    createMockFile('documents/', 'backup.zip', 0, FileType.Directory, true),
    createMockFile('documents/file1.txt', 'backup.zip', 1024, FileType.File),
    createMockFile('documents/file2.pdf', 'backup.zip', 512000, FileType.Document),
    createMockFile('images/', 'backup.zip', 0, FileType.Directory, true),
    createMockFile('images/photo1.jpg', 'backup.zip', 2048000, FileType.Image),
    createMockFile('images/photo2.png', 'backup.zip', 1536000, FileType.Image),
    createMockFile('README.txt', 'backup.zip', 2048, FileType.File),
  ],
  'vacation_photos.zip': [
    createMockFile('2024/', 'vacation_photos.zip', 0, FileType.Directory, true),
    createMockFile('2024/january/', 'vacation_photos.zip', 0, FileType.Directory, true),
    createMockFile('2024/january/IMG_001.jpg', 'vacation_photos.zip', 3145728, FileType.Image),
    createMockFile('2024/january/IMG_002.jpg', 'vacation_photos.zip', 2621440, FileType.Image),
    createMockFile('2024/february/', 'vacation_photos.zip', 0, FileType.Directory, true),
    createMockFile('2024/february/IMG_003.jpg', 'vacation_photos.zip', 4194304, FileType.Image),
  ]
};

// Mock search results
export const generateMockSearchResults = (query: string): FileInfo[] => {
  const allFiles = [
    ...generateMockFiles('/Users/andrew/Documents'),
    ...generateMockFiles('/Users/andrew/Downloads'),
    ...generateMockFiles('/Users/andrew/Documents/Projects'),
  ];

  return allFiles.filter(file =>
    file.name.toLowerCase().includes(query.toLowerCase()) ||
    file.extension?.toLowerCase().includes(query.toLowerCase())
  );
};