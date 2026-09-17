/**
 * Formatting utilities for file sizes, counts, and paths.
 * Pure TypeScript, zero external dependencies.
 */

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;

/**
 * Formats a byte size number into human-readable string (e.g. 18.42 GB).
 * Uses base 1024 binary units.
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0 || !Number.isFinite(bytes)) return '0 B';
  if (bytes < 0) return '-' + formatBytes(-bytes, decimals);

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const unitIndex = Math.min(i, BYTE_UNITS.length - 1);

  const value = bytes / Math.pow(k, unitIndex);
  
  // Clean decimal representation (omit trailing zeroes if not needed)
  const formattedValue = parseFloat(value.toFixed(dm));
  return `${formattedValue} ${BYTE_UNITS[unitIndex]}`;
}

/**
 * Formats an integer count with localized thousand separators (e.g. 1,284,421).
 */
export function formatNumber(count: number): string {
  if (!Number.isFinite(count)) return '0';
  return count.toLocaleString('en-US');
}

/**
 * Formats milliseconds into human-readable duration (e.g. 1m 24s or 450ms).
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = Math.round(seconds % 60);
  return `${minutes}m ${remainingSecs}s`;
}

/**
 * Shortens a path for display by inserting an ellipsis if it exceeds maxLength.
 */
export function truncatePath(path: string, maxLength: number = 50): string {
  if (!path || path.length <= maxLength) return path;
  
  const isAbsoluteUnix = path.startsWith('/');
  const separator = path.includes('/') ? '/' : '\\';
  const parts = path.split(separator).filter(Boolean);
  
  if (parts.length <= 2) {
    return path.substring(0, maxLength - 3) + '...';
  }
  
  const prefix = isAbsoluteUnix ? '/' + parts[0] : parts[0];
  const last = parts[parts.length - 1];
  
  return `${prefix}${separator}...${separator}${last}`;
}
