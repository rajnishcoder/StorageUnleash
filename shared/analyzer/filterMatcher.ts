import type { FileNode } from '../models/fileNode';
import { categorizeFile } from './categorizer';

export const FILTER_DEFINITIONS: Record<string, { label: string; match: (node: FileNode) => boolean }> = {
  node: {
    label: 'Node.js',
    match: (node) => {
      const p = (node.path || node.name).toLowerCase();
      return p.includes('node_modules') || p.includes('.npm') || p.includes('.pnpm') || p.includes('.yarn');
    }
  },
  xcode: {
    label: 'Xcode',
    match: (node) => {
      const p = (node.path || node.name).toLowerCase();
      return p.includes('deriveddata') || p.includes('ios devicesupport') || p.includes('coresimulator') || p.includes('xcode');
    }
  },
  artifacts: {
    label: 'Build Artifacts',
    match: (node) => {
      const name = node.name.toLowerCase();
      const p = (node.path || node.name).toLowerCase();
      return (
        name === 'dist' ||
        name === 'build' ||
        name === 'target' ||
        name === '.next' ||
        name === '.nuxt' ||
        name === 'out' ||
        p.includes('/target/') ||
        p.includes('/dist/') ||
        p.includes('/build/')
      );
    }
  },
  android: {
    label: 'Android',
    match: (node) => {
      const p = (node.path || node.name).toLowerCase();
      return p.includes('.android') || p.includes('.gradle') || p.includes('android/sdk');
    }
  },
  docker: {
    label: 'Docker',
    match: (node) => {
      const p = (node.path || node.name).toLowerCase();
      return p.includes('docker') || p.includes('com.docker');
    }
  },
  videos: {
    label: 'Videos',
    match: (node) => {
      return categorizeFile(node.extension || node.name) === 'video';
    }
  },
  disk_images: {
    label: 'Disk Images',
    match: (node) => {
      const ext = (node.extension || '').toLowerCase();
      const name = node.name.toLowerCase();
      return ext === 'dmg' || ext === 'iso' || ext === 'vmdk' || ext === 'img' || ext === 'qcow2' || name.endsWith('.dmg');
    }
  },
  archives: {
    label: 'Archives',
    match: (node) => {
      return categorizeFile(node.extension || node.name) === 'archive';
    }
  },
  ios_backups: {
    label: 'iOS Backups',
    match: (node) => {
      const p = (node.path || node.name).toLowerCase();
      return p.includes('mobilesync/backup') || p.includes('mobilesync');
    }
  },
  virtual_machines: {
    label: 'Virtual Machines',
    match: (node) => {
      const p = (node.path || node.name).toLowerCase();
      return p.includes('.utm') || p.includes('parallels') || p.includes('virtualbox') || p.includes('.pvm');
    }
  },
  large_media: {
    label: 'Large Media',
    match: (node) => {
      const isMedia = ['video', 'audio', 'image', 'archive'].includes(categorizeFile(node.extension || node.name));
      return isMedia && node.size >= 100 * 1024 * 1024; // > 100MB
    }
  },
  logs_caches: {
    label: 'Logs & Caches',
    match: (node) => {
      const name = node.name.toLowerCase();
      const p = (node.path || node.name).toLowerCase();
      return name.includes('cache') || name.includes('log') || p.includes('/caches') || p.includes('/logs') || p.includes('/.cache');
    }
  }
};

/**
 * Checks if a FileNode matches any of the active filters or search query.
 */
export function isNodeHighlighted(
  node: FileNode | undefined,
  activeFilters: Record<string, boolean>,
  searchQuery: string
): boolean {
  if (!node) return false;

  // Search query match
  if (searchQuery && searchQuery.trim().length > 0) {
    const q = searchQuery.toLowerCase().trim();
    if (node.name.toLowerCase().includes(q) || (node.path && node.path.toLowerCase().includes(q))) {
      return true;
    }
  }

  // Active dev bloat filters
  const activeKeys = Object.keys(activeFilters).filter((k) => activeFilters[k]);
  if (activeKeys.length === 0) return false;

  for (const key of activeKeys) {
    const def = FILTER_DEFINITIONS[key];
    if (def && def.match(node)) {
      return true;
    }
  }

  return false;
}
