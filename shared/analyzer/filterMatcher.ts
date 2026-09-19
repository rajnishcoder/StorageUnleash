import type { FileNode } from '../models/fileNode';
import { categorizeFile } from './categorizer';

export const FILTER_DEFINITIONS: Record<string, { label: string; match: (node: FileNode) => boolean }> = {
  ai_models: {
    label: 'AI & LLM Models',
    match: (node) => {
      const p = (node.path || node.name).toLowerCase();
      const name = node.name.toLowerCase();
      return (
        name === '.ollama' ||
        name === 'ollama' ||
        name === '.lmstudio' ||
        p.includes('/.ollama') ||
        p.includes('/ollama/models') ||
        p.includes('/.cache/huggingface') ||
        p.includes('/huggingface/hub') ||
        p.includes('/.lmstudio') ||
        p.includes('/.cache/llama.cpp') ||
        p.includes('/.cache/whisper') ||
        p.includes('/.cache/vllm') ||
        p.includes('models/blobs')
      );
    }
  },
  node: {
    label: 'Node.js & npm',
    match: (node) => {
      const p = (node.path || node.name).toLowerCase();
      const name = node.name.toLowerCase();
      return (
        name === 'node_modules' ||
        name === '.npm' ||
        name === '.pnpm-store' ||
        name === '.yarn' ||
        name === '.bun' ||
        p.includes('/node_modules') ||
        p.includes('/.npm') ||
        p.includes('/.pnpm') ||
        p.includes('/.yarn') ||
        p.includes('/.bun')
      );
    }
  },
  python: {
    label: 'Python & Envs',
    match: (node) => {
      const p = (node.path || node.name).toLowerCase();
      const name = node.name.toLowerCase();
      return (
        name === '.venv' ||
        name === 'venv' ||
        name === '__pycache__' ||
        name === '.conda' ||
        name === 'anaconda3' ||
        name === 'miniconda3' ||
        p.includes('/site-packages') ||
        p.includes('/__pycache__') ||
        p.includes('/.venv') ||
        p.includes('/venv') ||
        p.includes('/.conda')
      );
    }
  },
  xcode: {
    label: 'Xcode & Simulators',
    match: (node) => {
      const p = (node.path || node.name).toLowerCase();
      const name = node.name.toLowerCase();
      return (
        name === 'deriveddata' ||
        name === 'coresimulator' ||
        name === 'ios devicesupport' ||
        p.includes('/deriveddata') ||
        p.includes('/ios devicesupport') ||
        p.includes('/coresimulator') ||
        p.includes('/xcode/userdata') ||
        p.includes('/xcode/archives')
      );
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
        name === '.turbo' ||
        name === 'out' ||
        name === 'coverage' ||
        p.includes('/target/') ||
        p.includes('/dist/') ||
        p.includes('/build/') ||
        p.includes('/.next')
      );
    }
  },
  docker: {
    label: 'Docker & Containers',
    match: (node) => {
      const p = (node.path || node.name).toLowerCase();
      const name = node.name.toLowerCase();
      return (
        name === 'com.docker.docker' ||
        name === '.docker' ||
        p.includes('com.docker') ||
        p.includes('docker.raw') ||
        p.includes('/.docker') ||
        p.includes('/containerd') ||
        p.includes('/podman')
      );
    }
  },
  android: {
    label: 'Android SDK & Gradle',
    match: (node) => {
      const p = (node.path || node.name).toLowerCase();
      const name = node.name.toLowerCase();
      return (
        name === '.gradle' ||
        name === '.android' ||
        p.includes('/.android') ||
        p.includes('/.gradle') ||
        p.includes('android/sdk')
      );
    }
  },
  disk_images: {
    label: 'Disk Images & Installers',
    match: (node) => {
      const ext = (node.extension || '').toLowerCase();
      const name = node.name.toLowerCase();
      return (
        ext === 'dmg' ||
        ext === 'iso' ||
        ext === 'pkg' ||
        ext === 'vmdk' ||
        ext === 'img' ||
        ext === 'qcow2' ||
        name.endsWith('.dmg') ||
        name.endsWith('.pkg') ||
        name.endsWith('.iso')
      );
    }
  },
  logs_caches: {
    label: 'Caches & Logs',
    match: (node) => {
      const name = node.name.toLowerCase();
      const p = (node.path || node.name).toLowerCase();
      return (
        name === 'caches' ||
        name === 'logs' ||
        name === '.cache' ||
        name === 'tmp' ||
        p.includes('/library/caches') ||
        p.includes('/library/logs') ||
        p.includes('/.cache') ||
        p.includes('/caches/') ||
        p.includes('/logs/')
      );
    }
  },
  videos: {
    label: 'Videos',
    match: (node) => {
      return categorizeFile(node.extension || node.name) === 'video';
    }
  },
  archives: {
    label: 'Archives & Zips',
    match: (node) => {
      return categorizeFile(node.extension || node.name) === 'archive';
    }
  },
  large_media: {
    label: 'Large Files (>100MB)',
    match: (node) => {
      return node.type === 'file' && node.size >= 100 * 1024 * 1024;
    }
  },
  virtual_machines: {
    label: 'Virtual Machines',
    match: (node) => {
      const p = (node.path || node.name).toLowerCase();
      return (
        p.includes('.utm') ||
        p.includes('parallels') ||
        p.includes('virtualbox') ||
        p.includes('.pvm') ||
        p.includes('virtual machines')
      );
    }
  },
  ios_backups: {
    label: 'iOS Backups',
    match: (node) => {
      const p = (node.path || node.name).toLowerCase();
      return p.includes('mobilesync/backup') || p.includes('mobilesync');
    }
  }
};

export interface SmartFilterStat {
  id: string;
  size: number;
  count: number;
}

/**
 * Computes live aggregate storage size and file count for each smart filter from a FileNode tree.
 */
export function calculateSmartFilterStats(root: FileNode | null): Record<string, SmartFilterStat> {
  const result: Record<string, SmartFilterStat> = {};

  for (const key of Object.keys(FILTER_DEFINITIONS)) {
    result[key] = { id: key, size: 0, count: 0 };
  }

  if (!root) return result;

  for (const key of Object.keys(FILTER_DEFINITIONS)) {
    const def = FILTER_DEFINITIONS[key];

    function traverse(node: FileNode) {
      if (def.match(node)) {
        result[key].size += node.size;
        result[key].count += (node.fileCount || (node.type === 'file' ? 1 : 0));
        return;
      }

      if (node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    }

    traverse(root);
  }

  return result;
}

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

  // Active smart filters
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
