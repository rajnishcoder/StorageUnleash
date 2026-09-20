import type { FileNode } from '../models/fileNode';
import { categorizeFile } from './categorizer';

export const FILTER_DEFINITIONS: Record<string, { label: string; match: (node: FileNode) => boolean }> = {
  photos: {
    label: 'Photos & RAW Media',
    match: (node) => {
      const p = (node.path || node.name).toLowerCase();
      const ext = (node.extension || '').toLowerCase();
      return (
        categorizeFile(ext || node.name) === 'image' ||
        p.includes('.photoslibrary') ||
        ext === 'raw' ||
        ext === 'cr2' ||
        ext === 'nef' ||
        ext === 'arw' ||
        ext === 'dng' ||
        ext === 'heic' ||
        ext === 'psd' ||
        ext === 'ai'
      );
    }
  },
  videos: {
    label: 'Videos',
    match: (node) => {
      return categorizeFile(node.extension || node.name) === 'video';
    }
  },
  audio: {
    label: 'Music & Audio',
    match: (node) => {
      return categorizeFile(node.extension || node.name) === 'audio';
    }
  },
  documents: {
    label: 'Documents & PDFs',
    match: (node) => {
      return categorizeFile(node.extension || node.name) === 'document';
    }
  },
  browser_caches: {
    label: 'Browser Data & Caches',
    match: (node) => {
      const p = (node.path || node.name).toLowerCase();
      return (
        p.includes('/google/chrome') ||
        p.includes('/safari') ||
        p.includes('/bravesoftware') ||
        p.includes('/mozilla/firefox') ||
        p.includes('/arc') ||
        p.includes('/microsoft edge') ||
        p.includes('application support/google/chrome') ||
        p.includes('caches/google/chrome')
      );
    }
  },
  mail_messages: {
    label: 'Mail & Messages',
    match: (node) => {
      const p = (node.path || node.name).toLowerCase();
      return p.includes('/library/mail') || p.includes('/library/messages') || p.includes('messages/attachments');
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
  games: {
    label: 'Games & Steam Data',
    match: (node) => {
      const p = (node.path || node.name).toLowerCase();
      return p.includes('steamapps') || p.includes('epic games') || p.includes('riot games') || p.includes('/steam/');
    }
  },
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

const PHOTO_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'heic', 'psd', 'ai', 'raw', 'cr2', 'nef', 'arw', 'dng', 'tiff']);
const VIDEO_EXTS = new Set(['mp4', 'mkv', 'mov', 'avi', 'wmv', 'flv', 'webm', 'm4v']);
const AUDIO_EXTS = new Set(['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma']);
const DOC_EXTS = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'md', 'rtf', 'csv', 'epub']);
const ARCHIVE_EXTS = new Set(['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso', 'dmg']);
const DISK_IMAGE_EXTS = new Set(['dmg', 'iso', 'pkg', 'vmdk', 'img', 'qcow2']);

export interface SmartFilterStat {
  id: string;
  size: number;
  count: number;
}

/**
 * Computes live aggregate storage size and file count for each smart filter in a single O(N) pass.
 */
export function calculateSmartFilterStats(root: FileNode | null): Record<string, SmartFilterStat> {
  const result: Record<string, SmartFilterStat> = {};

  for (const key of Object.keys(FILTER_DEFINITIONS)) {
    result[key] = { id: key, size: 0, count: 0 };
  }

  if (!root) return result;

  function traverse(node: FileNode) {
    const isFile = node.type === 'file';
    const size = node.size || 0;

    // Fast O(1) Set extension checks for files
    if (isFile) {
      const ext = node.extension ? node.extension.toLowerCase() : '';
      if (PHOTO_EXTS.has(ext)) {
        result.photos.size += size;
        result.photos.count += 1;
      }
      if (VIDEO_EXTS.has(ext)) {
        result.videos.size += size;
        result.videos.count += 1;
      }
      if (AUDIO_EXTS.has(ext)) {
        result.audio.size += size;
        result.audio.count += 1;
      }
      if (DOC_EXTS.has(ext)) {
        result.documents.size += size;
        result.documents.count += 1;
      }
      if (ARCHIVE_EXTS.has(ext)) {
        result.archives.size += size;
        result.archives.count += 1;
      }
      if (
        DISK_IMAGE_EXTS.has(ext) ||
        node.name.endsWith('.dmg') ||
        node.name.endsWith('.pkg') ||
        node.name.endsWith('.iso')
      ) {
        result.disk_images.size += size;
        result.disk_images.count += 1;
      }
      if (size >= 104857600) {
        // >= 100 MB
        result.large_media.size += size;
        result.large_media.count += 1;
      }
      return;
    }

    // Directory-level classifications
    const nameLower = node.name.toLowerCase();
    const pathLower = (node.path || node.name).toLowerCase();
    const count = node.fileCount || 0;

    let isSubtreeCategoryMatched = false;

    // Photos library
    if (nameLower.endsWith('.photoslibrary') || pathLower.includes('.photoslibrary')) {
      result.photos.size += size;
      result.photos.count += count;
      isSubtreeCategoryMatched = true;
    }

    // Node.js & npm
    if (
      nameLower === 'node_modules' ||
      nameLower === '.npm' ||
      nameLower === '.pnpm-store' ||
      nameLower === '.yarn' ||
      nameLower === '.bun' ||
      pathLower.includes('/node_modules') ||
      pathLower.includes('/.npm') ||
      pathLower.includes('/.pnpm') ||
      pathLower.includes('/.yarn') ||
      pathLower.includes('/.bun')
    ) {
      result.node.size += size;
      result.node.count += count;
      isSubtreeCategoryMatched = true;
    }

    // Python & Envs
    if (
      nameLower === '.venv' ||
      nameLower === 'venv' ||
      nameLower === '__pycache__' ||
      nameLower === '.conda' ||
      nameLower === 'anaconda3' ||
      nameLower === 'miniconda3' ||
      pathLower.includes('/site-packages') ||
      pathLower.includes('/__pycache__') ||
      pathLower.includes('/.venv') ||
      pathLower.includes('/venv') ||
      pathLower.includes('/.conda')
    ) {
      result.python.size += size;
      result.python.count += count;
      isSubtreeCategoryMatched = true;
    }

    // AI & LLM Models
    if (
      nameLower === '.ollama' ||
      nameLower === 'ollama' ||
      nameLower === '.lmstudio' ||
      pathLower.includes('/.ollama') ||
      pathLower.includes('/ollama/models') ||
      pathLower.includes('/.cache/huggingface') ||
      pathLower.includes('/huggingface/hub') ||
      pathLower.includes('/.lmstudio') ||
      pathLower.includes('/.cache/llama.cpp') ||
      pathLower.includes('/.cache/whisper') ||
      pathLower.includes('/.cache/vllm') ||
      pathLower.includes('models/blobs')
    ) {
      result.ai_models.size += size;
      result.ai_models.count += count;
      isSubtreeCategoryMatched = true;
    }

    // Xcode & Simulators
    if (
      nameLower === 'deriveddata' ||
      nameLower === 'coresimulator' ||
      nameLower === 'ios devicesupport' ||
      pathLower.includes('/deriveddata') ||
      pathLower.includes('/ios devicesupport') ||
      pathLower.includes('/coresimulator') ||
      pathLower.includes('/xcode/userdata') ||
      pathLower.includes('/xcode/archives')
    ) {
      result.xcode.size += size;
      result.xcode.count += count;
      isSubtreeCategoryMatched = true;
    }

    // Build Artifacts
    if (
      nameLower === 'dist' ||
      nameLower === 'build' ||
      nameLower === 'target' ||
      nameLower === '.next' ||
      nameLower === '.nuxt' ||
      nameLower === '.turbo' ||
      nameLower === 'out' ||
      nameLower === 'coverage' ||
      pathLower.includes('/target/') ||
      pathLower.includes('/dist/') ||
      pathLower.includes('/build/') ||
      pathLower.includes('/.next')
    ) {
      result.artifacts.size += size;
      result.artifacts.count += count;
      isSubtreeCategoryMatched = true;
    }

    // Docker & Containers
    if (
      nameLower === 'com.docker.docker' ||
      nameLower === '.docker' ||
      pathLower.includes('com.docker') ||
      pathLower.includes('docker.raw') ||
      pathLower.includes('/.docker') ||
      pathLower.includes('/containerd') ||
      pathLower.includes('/podman')
    ) {
      result.docker.size += size;
      result.docker.count += count;
      isSubtreeCategoryMatched = true;
    }

    // Android SDK & Gradle
    if (
      nameLower === '.gradle' ||
      nameLower === '.android' ||
      pathLower.includes('/.android') ||
      pathLower.includes('/.gradle') ||
      pathLower.includes('android/sdk')
    ) {
      result.android.size += size;
      result.android.count += count;
      isSubtreeCategoryMatched = true;
    }

    // Caches & Logs
    if (
      nameLower === 'caches' ||
      nameLower === 'logs' ||
      nameLower === '.cache' ||
      nameLower === 'tmp' ||
      pathLower.includes('/library/caches') ||
      pathLower.includes('/library/logs') ||
      pathLower.includes('/.cache') ||
      pathLower.includes('/caches/') ||
      pathLower.includes('/logs/')
    ) {
      result.logs_caches.size += size;
      result.logs_caches.count += count;
      isSubtreeCategoryMatched = true;
    }

    // Browser Caches & Data
    if (
      pathLower.includes('/google/chrome') ||
      pathLower.includes('/safari') ||
      pathLower.includes('/bravesoftware') ||
      pathLower.includes('/mozilla/firefox') ||
      pathLower.includes('/arc') ||
      pathLower.includes('/microsoft edge') ||
      pathLower.includes('application support/google/chrome') ||
      pathLower.includes('caches/google/chrome')
    ) {
      result.browser_caches.size += size;
      result.browser_caches.count += count;
      isSubtreeCategoryMatched = true;
    }

    // Mail & Messages
    if (
      pathLower.includes('/library/mail') ||
      pathLower.includes('/library/messages') ||
      pathLower.includes('messages/attachments')
    ) {
      result.mail_messages.size += size;
      result.mail_messages.count += count;
      isSubtreeCategoryMatched = true;
    }

    // Games & Steam Data
    if (
      pathLower.includes('steamapps') ||
      pathLower.includes('epic games') ||
      pathLower.includes('riot games') ||
      pathLower.includes('/steam/')
    ) {
      result.games.size += size;
      result.games.count += count;
      isSubtreeCategoryMatched = true;
    }

    // Virtual Machines
    if (
      pathLower.includes('.utm') ||
      pathLower.includes('parallels') ||
      pathLower.includes('virtualbox') ||
      pathLower.includes('.pvm') ||
      pathLower.includes('virtual machines')
    ) {
      result.virtual_machines.size += size;
      result.virtual_machines.count += count;
      isSubtreeCategoryMatched = true;
    }

    // iOS Backups
    if (
      pathLower.includes('mobilesync/backup') ||
      pathLower.includes('mobilesync')
    ) {
      result.ios_backups.size += size;
      result.ios_backups.count += count;
      isSubtreeCategoryMatched = true;
    }

    // Traverse children if present and not already accounted for as an entire subtree
    if (node.children && node.children.length > 0 && !isSubtreeCategoryMatched) {
      for (let i = 0; i < node.children.length; i++) {
        traverse(node.children[i]);
      }
    }
  }

  if (root.children && root.children.length > 0) {
    for (let i = 0; i < root.children.length; i++) {
      traverse(root.children[i]);
    }
  } else {
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
