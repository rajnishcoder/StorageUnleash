import type { FileCategory, FileNode } from '../models/fileNode';

export interface CategoryStats {
  category: FileCategory;
  label: string;
  size: number;
  fileCount: number;
  color: string;
}

const EXTENSION_MAP: Record<string, FileCategory> = {
  // Video
  mp4: 'video', mkv: 'video', mov: 'video', avi: 'video', wmv: 'video', flv: 'video', webm: 'video', m4v: 'video',
  // Image
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', svg: 'image', webp: 'image', heic: 'image', psd: 'image', ai: 'image', raw: 'image', tiff: 'image',
  // Audio
  mp3: 'audio', wav: 'audio', flac: 'audio', aac: 'audio', ogg: 'audio', m4a: 'audio', wma: 'audio',
  // Documents
  pdf: 'document', doc: 'document', docx: 'document', xls: 'document', xlsx: 'document', ppt: 'document', pptx: 'document', txt: 'document', md: 'document', rtf: 'document', csv: 'document', epub: 'document',
  // Archives
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive', bz2: 'archive', xz: 'archive', iso: 'archive', dmg: 'archive',
  // Applications
  app: 'application', exe: 'application', dmg_app: 'application', pkg: 'application', deb: 'application', rpm: 'application', apk: 'application',
  // Code
  ts: 'code', tsx: 'code', js: 'code', jsx: 'code', html: 'code', css: 'code', scss: 'code', json: 'code', py: 'code', go: 'code', rs: 'code', c: 'code', cpp: 'code', h: 'code', java: 'code', kt: 'code', swift: 'code', rb: 'code', php: 'code', sh: 'code', sql: 'code', yml: 'code', yaml: 'code'
};

export const CATEGORY_COLORS: Record<FileCategory, string> = {
  video: '#f43f5e',       // Rose / Red
  image: '#ec4899',       // Pink
  audio: '#a855f7',       // Purple
  document: '#3b82f6',    // Blue
  archive: '#eab308',     // Yellow / Amber
  application: '#06b6d4', // Cyan
  code: '#10b981',        // Emerald / Green
  other: '#64748b'        // Slate
};

export const CATEGORY_LABELS: Record<FileCategory, string> = {
  video: 'Videos',
  image: 'Images',
  audio: 'Audio',
  document: 'Documents',
  archive: 'Archives',
  application: 'Applications',
  code: 'Code',
  other: 'Other'
};

/**
 * Returns the category for a given file name or extension.
 */
export function categorizeFile(nameOrExt: string): FileCategory {
  let ext = '';
  if (nameOrExt.includes('.')) {
    const parts = nameOrExt.split('.');
    ext = (parts.pop() || '').toLowerCase();
  } else {
    ext = nameOrExt.toLowerCase();
  }

  return EXTENSION_MAP[ext] || 'other';
}

/**
 * Aggregates all files in a FileNode tree into category statistics.
 */
export function aggregateCategories(root: FileNode): CategoryStats[] {
  const statsMap: Record<FileCategory, { size: number; count: number }> = {
    video: { size: 0, count: 0 },
    image: { size: 0, count: 0 },
    audio: { size: 0, count: 0 },
    document: { size: 0, count: 0 },
    archive: { size: 0, count: 0 },
    application: { size: 0, count: 0 },
    code: { size: 0, count: 0 },
    other: { size: 0, count: 0 }
  };

  function traverse(node: FileNode) {
    if (node.type === 'file') {
      const cat = categorizeFile(node.extension || node.name);
      statsMap[cat].size += node.size;
      statsMap[cat].count += 1;
    } else if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  traverse(root);

  return (Object.keys(statsMap) as FileCategory[])
    .map((cat) => ({
      category: cat,
      label: CATEGORY_LABELS[cat],
      size: statsMap[cat].size,
      fileCount: statsMap[cat].count,
      color: CATEGORY_COLORS[cat]
    }))
    .filter((stat) => stat.size > 0 || stat.fileCount > 0)
    .sort((a, b) => b.size - a.size);
}
