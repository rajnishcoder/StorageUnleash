import { shell } from 'electron';
import type { TrashResult, TrashItemResult } from '@shared/models/fileNode';

/**
 * Safely moves files or directories to macOS Trash or Windows Recycle Bin.
 */
export async function moveToTrash(paths: string[]): Promise<TrashResult> {
  const results: TrashItemResult[] = [];
  let allSuccess = true;

  for (const itemPath of paths) {
    try {
      await shell.trashItem(itemPath);
      results.push({ path: itemPath, success: true });
    } catch (error: any) {
      console.error(`[Trash] Failed to move ${itemPath} to trash:`, error);
      allSuccess = false;
      results.push({
        path: itemPath,
        success: false,
        error: error?.message || 'Failed to move to trash'
      });
    }
  }

  return {
    success: allSuccess,
    results
  };
}
