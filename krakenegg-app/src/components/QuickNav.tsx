import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { invoke } from '@tauri-apps/api/core';
import {
  Home, FolderDown, FileText, Image, Music, Film, Monitor, HardDrive,
  Globe, Star, Tag, Folder, X, Trash2, Settings, Cloud
} from 'lucide-react';

interface QuickNavProps {
  side: 'left' | 'right';
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  color?: string;
}

// macOS Finder standard tag colors in FavoriteTagNames order
const FINDER_TAG_COLORS = [
  '#FF3B30', // Red (index 0)
  '#FF9500', // Orange (index 1)
  '#FFCC00', // Yellow (index 2)
  '#34C759', // Green (index 3)
  '#007AFF', // Blue (index 4)
  '#AF52DE', // Purple (index 5)
  '#8E8E93', // Gray (index 6)
];

// Fallback: map known color names to colors (for tags beyond the 7 standard positions)
const FINDER_TAG_COLOR_MAP: Record<string, string> = {
  'Red': '#FF3B30',
  'Orange': '#FF9500',
  'Yellow': '#FFCC00',
  'Green': '#34C759',
  'Blue': '#007AFF',
  'Purple': '#AF52DE',
  'Gray': '#8E8E93',
};

const DEFAULT_TAGS = [
  { name: 'Red', color: '#FF3B30' },
  { name: 'Orange', color: '#FF9500' },
  { name: 'Yellow', color: '#FFCC00' },
  { name: 'Green', color: '#34C759' },
  { name: 'Blue', color: '#007AFF' },
  { name: 'Purple', color: '#AF52DE' },
  { name: 'Gray', color: '#8E8E93' },
];

export const QuickNav = ({ side, anchorRef, onClose }: QuickNavProps) => {
  const setPath = useStore(s => s.setPath);
  const hotlist = useStore(s => s.hotlist);
  const [homeDir, setHomeDir] = useState('/Users');
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    invoke<string>('get_home_directory').then(h => setHomeDir(h)).catch(() => {});
    invoke<string[]>('get_finder_tags').then(names => {
      if (names.length > 0) {
        setTags(names.map((name, i) => ({
          name,
          color: i < FINDER_TAG_COLORS.length
            ? FINDER_TAG_COLORS[i]
            : FINDER_TAG_COLOR_MAP[name] || '#8E8E93',
        })));
      }
    }).catch(() => {});
  }, []);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    setTimeout(() => {
      document.addEventListener('mousedown', handler);
      document.addEventListener('keydown', keyHandler);
    }, 50);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [onClose]);

  const navigate = (path: string) => {
    setPath(side, path);
    onClose();
  };

  const locations: NavItem[] = [
    { label: 'Home', path: homeDir, icon: <Home size={14} /> },
    { label: 'Desktop', path: `${homeDir}/Desktop`, icon: <Monitor size={14} /> },
    { label: 'Documents', path: `${homeDir}/Documents`, icon: <FileText size={14} /> },
    { label: 'Downloads', path: `${homeDir}/Downloads`, icon: <FolderDown size={14} /> },
    { label: 'Pictures', path: `${homeDir}/Pictures`, icon: <Image size={14} /> },
    { label: 'Music', path: `${homeDir}/Music`, icon: <Music size={14} /> },
    { label: 'Movies', path: `${homeDir}/Movies`, icon: <Film size={14} /> },
    { label: 'Applications', path: '/Applications', icon: <Settings size={14} /> },
  ];

  const system: NavItem[] = [
    { label: 'Root', path: '/', icon: <HardDrive size={14} /> },
    { label: 'Volumes', path: '/Volumes', icon: <HardDrive size={14} /> },
    { label: 'Trash', path: `${homeDir}/.Trash`, icon: <Trash2 size={14} /> },
    { label: 'Temp', path: '/tmp', icon: <Folder size={14} /> },
  ];

  const anchorRect = anchorRef.current?.getBoundingClientRect();
  const top = anchorRect ? anchorRect.bottom + 4 : 100;
  const left = anchorRect ? anchorRect.left : 100;

  return createPortal(
    <div
      ref={panelRef}
      className="fixed w-56 rounded-lg shadow-2xl overflow-hidden select-none"
      style={{ top, left, zIndex: 9000, backgroundColor: 'var(--ke-bg-solid)', border: '1px solid var(--ke-border)' }}
    >
      {/* Favorites */}
      {hotlist.length > 0 && (
        <div className="p-1.5">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ke-text-tertiary)' }}>
            Favorites
          </div>
          {hotlist.map(path => {
            const name = path === '/' ? 'Root' : path.split('/').pop() || path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors hover:bg-[var(--ke-accent)] hover:text-white"
                style={{ color: 'var(--ke-text)' }}
              >
                <Star size={13} style={{ color: '#FFCC00' }} className="shrink-0" />
                <span className="truncate">{name}</span>
              </button>
            );
          })}
        </div>
      )}

      {hotlist.length > 0 && <div className="h-px mx-2" style={{ backgroundColor: 'var(--ke-border-subtle)' }} />}

      {/* Locations */}
      <div className="p-1.5">
        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ke-text-tertiary)' }}>
          Locations
        </div>
        {locations.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors hover:bg-[var(--ke-accent)] hover:text-white"
            style={{ color: 'var(--ke-text)' }}
          >
            <span className="shrink-0" style={{ color: 'var(--ke-icon-folder)' }}>{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="h-px mx-2" style={{ backgroundColor: 'var(--ke-border-subtle)' }} />

      {/* System */}
      <div className="p-1.5">
        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ke-text-tertiary)' }}>
          System
        </div>
        {system.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors hover:bg-[var(--ke-accent)] hover:text-white"
            style={{ color: 'var(--ke-text)' }}
          >
            <span className="shrink-0" style={{ color: 'var(--ke-text-secondary)' }}>{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="h-px mx-2" style={{ backgroundColor: 'var(--ke-border-subtle)' }} />

      {/* Tags */}
      <div className="p-1.5 pb-2">
        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ke-text-tertiary)' }}>
          Tags
        </div>
        <div className="flex flex-wrap gap-1 px-2 pt-1">
          {tags.map(tag => (
            <button
              key={tag.name}
              title={tag.name}
              className="w-5 h-5 rounded-full transition-transform hover:scale-125 active:scale-95"
              style={{ backgroundColor: tag.color }}
              onClick={async () => {
                onClose();
                const store = useStore.getState();
                // Show search modal with tag results
                store.showSearch();
                useStore.setState(s => ({ search: { ...s.search, query: `Tag: ${tag.name}`, loading: true } }));
                try {
                  const results = await invoke<any[]>('find_by_tag', { tag: tag.name });
                  useStore.setState(s => ({ search: { ...s.search, results, loading: false } }));
                } catch {
                  useStore.setState(s => ({ search: { ...s.search, results: [], loading: false, error: `No files found with tag "${tag.name}"` } }));
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};
