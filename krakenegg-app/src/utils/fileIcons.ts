import {
  File, Folder, FolderOpen, Image, FileText, FileCode, FileArchive,
  FileAudio, FileVideo, FileSpreadsheet, FileType, Database,
  Terminal, Settings, Lock, Link, FileJson,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  // Images
  png: Image, jpg: Image, jpeg: Image, gif: Image, bmp: Image,
  webp: Image, svg: Image, ico: Image, tiff: Image, tif: Image,

  // Code
  ts: FileCode, tsx: FileCode, js: FileCode, jsx: FileCode,
  rs: FileCode, py: FileCode, rb: FileCode, go: FileCode,
  java: FileCode, c: FileCode, cpp: FileCode, h: FileCode,
  cs: FileCode, swift: FileCode, kt: FileCode, scala: FileCode,
  php: FileCode, lua: FileCode, r: FileCode, dart: FileCode,
  vue: FileCode, svelte: FileCode,

  // Documents
  txt: FileText, md: FileText, rtf: FileText, doc: FileText,
  docx: FileText, pdf: FileText, odt: FileText, tex: FileText,
  log: FileText, csv: FileText,

  // Data / Config
  json: FileJson, yaml: FileJson, yml: FileJson, toml: FileJson,
  xml: FileCode, ini: Settings, cfg: Settings, conf: Settings,
  env: Settings, properties: Settings,

  // Archives
  zip: FileArchive, tar: FileArchive, gz: FileArchive,
  bz2: FileArchive, xz: FileArchive, '7z': FileArchive,
  rar: FileArchive, tgz: FileArchive,

  // Audio
  mp3: FileAudio, wav: FileAudio, ogg: FileAudio, flac: FileAudio,
  aac: FileAudio, m4a: FileAudio, wma: FileAudio,

  // Video
  mp4: FileVideo, avi: FileVideo, mov: FileVideo, mkv: FileVideo,
  wmv: FileVideo, flv: FileVideo, webm: FileVideo,

  // Spreadsheets
  xls: FileSpreadsheet, xlsx: FileSpreadsheet, ods: FileSpreadsheet,

  // Database
  db: Database, sqlite: Database, sql: Database,

  // Fonts
  ttf: FileType, otf: FileType, woff: FileType, woff2: FileType,

  // Shell / executable
  sh: Terminal, bash: Terminal, zsh: Terminal, fish: Terminal,
  bat: Terminal, cmd: Terminal, ps1: Terminal,

  // Security
  pem: Lock, key: Lock, crt: Lock, cer: Lock, p12: Lock,
};

export function getFileIcon(file: { is_dir: boolean; extension?: string; is_symlink?: boolean; name: string }): LucideIcon {
  if (file.is_dir) return Folder;
  if (file.is_symlink) return Link;

  const ext = file.extension?.toLowerCase() || '';
  return ICON_MAP[ext] || File;
}

export function getFileIconColor(file: { is_dir: boolean; extension?: string; name: string }, isSelected: boolean, isActive: boolean): string {
  if (isSelected && isActive) return 'text-white';

  if (file.is_dir) return 'text-blue-400';

  const ext = file.extension?.toLowerCase() || '';

  // Color groups
  if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif'].includes(ext)) return 'text-pink-400';
  if (['ts', 'tsx', 'js', 'jsx', 'rs', 'py', 'go', 'java', 'c', 'cpp', 'swift', 'rb'].includes(ext)) return 'text-green-400';
  if (['json', 'yaml', 'yml', 'toml', 'xml'].includes(ext)) return 'text-yellow-400';
  if (['zip', 'tar', 'gz', 'rar', '7z', 'tgz', 'bz2'].includes(ext)) return 'text-orange-400';
  if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) return 'text-purple-400';
  if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return 'text-red-400';
  if (['sh', 'bash', 'zsh', 'bat', 'cmd'].includes(ext)) return 'text-emerald-400';

  return 'text-gray-400';
}
