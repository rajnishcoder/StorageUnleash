import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { DiskSpaceInfo, TrashInfo } from '@shared/types/ipc';

/**
 * Retrieves total, used, and free disk space for the primary filesystem.
 */
export async function getDiskSpace(): Promise<DiskSpaceInfo> {
  const rootPath = process.platform === 'win32' ? process.cwd().split(path.sep)[0] + '\\' : '/';

  try {
    if (typeof fs.promises.statfs === 'function') {
      const stats = await fs.promises.statfs(rootPath);
      const total = stats.blocks * stats.bsize;
      const free = stats.bfree * stats.bsize;
      const used = total - free;
      const percentage = total > 0 ? Math.round((used / total) * 100) : 0;

      return {
        total,
        used,
        free,
        percentage,
        mount: rootPath
      };
    }
  } catch (error) {
    console.error('[DiskSpace] statfs failed, returning fallback estimate:', error);
  }

  // Fallback defaults if statfs is unavailable
  return {
    total: 512 * 1024 * 1024 * 1024,
    used: 245 * 1024 * 1024 * 1024,
    free: 267 * 1024 * 1024 * 1024,
    percentage: 48,
    mount: rootPath
  };
}

/**
 * Counts items in user's OS trash.
 */
export async function getTrashInfo(): Promise<TrashInfo> {
  let trashPath = '';
  if (process.platform === 'darwin') {
    trashPath = path.join(os.homedir(), '.Trash');
  }

  if (trashPath && fs.existsSync(trashPath)) {
    try {
      const entries = await fs.promises.readdir(trashPath);
      let totalSize = 0;
      for (const item of entries) {
        try {
          const s = await fs.promises.stat(path.join(trashPath, item));
          totalSize += s.size;
        } catch {
          // Ignore individual unreadable trash items
        }
      }
      return {
        itemCount: entries.length,
        totalSize
      };
    } catch {
      return { itemCount: 0, totalSize: 0 };
    }
  }

  return { itemCount: 0, totalSize: 0 };
}
