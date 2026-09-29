/**
 * Cross-platform detection, labels, shortcuts, and path utilities.
 * Pure TypeScript, zero external dependencies, works in both Node.js (main process) and Browser (renderer).
 */

export type PlatformType = 'darwin' | 'win32' | 'linux' | 'desktop';

export interface PlatformDetails {
  platform: PlatformType;
  isMac: boolean;
  isWindows: boolean;
  isLinux: boolean;
  platformName: string;
  fileManagerName: string;
  trashName: string;
  modKey: string;
  modKeyName: string;
  pathSeparator: string;
}

/**
 * Resolves platform details for the given platform string or current runtime environment.
 */
export function getPlatformDetails(customPlatform?: string): PlatformDetails {
  let plat: string = customPlatform || '';

  if (!plat) {
    if (typeof process !== 'undefined' && process.platform) {
      plat = process.platform;
    } else if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      if (ua.includes('mac')) plat = 'darwin';
      else if (ua.includes('win')) plat = 'win32';
      else if (ua.includes('linux')) plat = 'linux';
      else plat = 'darwin';
    } else {
      plat = 'darwin';
    }
  }

  const isMac = plat === 'darwin' || plat === 'mac';
  const isWindows = plat === 'win32' || plat === 'windows';
  const isLinux = plat === 'linux';

  const resolvedPlatform: PlatformType = isMac ? 'darwin' : isWindows ? 'win32' : isLinux ? 'linux' : 'desktop';

  return {
    platform: resolvedPlatform,
    isMac,
    isWindows,
    isLinux,
    platformName: isMac ? 'macOS' : isWindows ? 'Windows' : isLinux ? 'Linux' : 'Desktop',
    fileManagerName: isMac ? 'Finder' : isWindows ? 'File Explorer' : 'File Manager',
    trashName: isWindows ? 'Recycle Bin' : 'Trash',
    modKey: isMac ? '⌘' : 'Ctrl',
    modKeyName: isMac ? 'Command' : 'Control',
    pathSeparator: isWindows ? '\\' : '/'
  };
}

/**
 * Normalizes any file path across macOS, Windows, and Linux.
 * - Converts mixed slashes
 * - Preserves Windows drive roots (e.g. "C:\")
 * - Preserves Unix root ("/")
 * - Trims trailing slashes unless it's a root
 */
export function normalizeCrossPath(inputPath: string): string {
  if (!inputPath || typeof inputPath !== 'string') return '';

  let normalized = inputPath.trim();

  // Check if Windows drive letter (e.g. "C:" or "c:\foo")
  const isWindowsDrive = /^[a-zA-Z]:/.test(normalized);

  if (isWindowsDrive) {
    // Standardize to backslashes for Windows
    normalized = normalized.replace(/\//g, '\\');
    // Ensure drive letter has a backslash if just "C:"
    if (/^[a-zA-Z]:$/.test(normalized)) {
      normalized += '\\';
    }
    // Remove redundant double slashes (except leading UNC \\)
    normalized = normalized.replace(/([^\\])\\{2,}/g, '$1\\');
    // Remove trailing slash if length > 3 (not root "C:\")
    if (normalized.length > 3 && normalized.endsWith('\\')) {
      normalized = normalized.slice(0, -1);
    }
  } else {
    // POSIX path: standardized to forward slashes
    normalized = normalized.replace(/\\/g, '/');
    // Remove redundant double slashes
    normalized = normalized.replace(/\/+/g, '/');
    // Remove trailing slash if not root "/"
    if (normalized.length > 1 && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
  }

  return normalized;
}

/**
 * Safely splits a path into segments for breadcrumb rendering across any OS.
 */
export function splitPathSegments(pathStr: string): string[] {
  if (!pathStr) return [];
  const normalized = normalizeCrossPath(pathStr);

  // Check if Windows drive root e.g. "C:\"
  if (/^[a-zA-Z]:\\?$/.test(normalized)) {
    return [normalized.toUpperCase()];
  }

  // Windows path
  if (/^[a-zA-Z]:\\/.test(normalized)) {
    const drive = normalized.substring(0, 3).toUpperCase(); // e.g. "C:\"
    const rest = normalized.substring(3).split('\\').filter(Boolean);
    return [drive, ...rest];
  }

  // Unix path
  if (normalized.startsWith('/')) {
    const parts = normalized.split('/').filter(Boolean);
    return parts.length === 0 ? ['/'] : ['/', ...parts];
  }

  return normalized.split(/[\\/]/).filter(Boolean);
}

/**
 * Checks if the given path is a root directory (e.g. "/", "C:\", "D:\").
 */
export function isDriveRoot(pathStr: string): boolean {
  if (!pathStr) return false;
  const n = normalizeCrossPath(pathStr);
  if (n === '/' || n === '') return true;
  return /^[a-zA-Z]:\\?$/.test(n);
}
