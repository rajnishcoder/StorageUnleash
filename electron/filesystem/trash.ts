import { shell } from 'electron';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
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

/**
 * Empties the system Trash / Recycle Bin.
 */
export async function emptyTrash(): Promise<boolean> {
  if (process.platform === 'darwin') {
    return new Promise((resolve) => {
      execFile('osascript', ['-e', 'tell application "Finder" to empty trash'], { timeout: 15000 }, (err) => {
        if (err) {
          console.error('[Trash] Failed to empty trash via AppleScript:', err);
          return resolve(false);
        }
        resolve(true);
      });
    });
  }

  if (process.platform === 'win32') {
    return new Promise((resolve) => {
      execFile('powershell', ['-NoProfile', '-Command', 'Clear-RecycleBin -Force -ErrorAction SilentlyContinue'], { timeout: 15000 }, (err) => {
        if (err) {
          console.error('[Trash] Failed to empty recycle bin via PowerShell:', err);
          return resolve(false);
        }
        resolve(true);
      });
    });
  }

  // Linux: remove files in ~/.local/share/Trash
  try {
    const trashFiles = path.join(os.homedir(), '.local/share/Trash/files');
    const trashInfo = path.join(os.homedir(), '.local/share/Trash/info');
    await fs.promises.rm(trashFiles, { recursive: true, force: true });
    await fs.promises.rm(trashInfo, { recursive: true, force: true });
    await fs.promises.mkdir(trashFiles, { recursive: true });
    await fs.promises.mkdir(trashInfo, { recursive: true });
    return true;
  } catch (err) {
    console.error('[Trash] Failed to empty linux trash:', err);
    return false;
  }
}

/**
 * Reveals / opens the system Trash / Recycle Bin in the native file manager.
 */
export async function openTrash(): Promise<void> {
  if (process.platform === 'darwin') {
    execFile('osascript', ['-e', 'tell application "Finder" to open trash'], (err) => {
      if (err) {
        shell.openPath(path.join(os.homedir(), '.Trash'));
      }
    });
  } else if (process.platform === 'win32') {
    shell.openPath('shell:RecycleBinFolder');
  } else {
    shell.openPath(path.join(os.homedir(), '.local/share/Trash/files'));
  }
}
