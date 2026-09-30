import { dialog, shell, ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@shared/types/ipc';
import { FilesystemScanner } from '../filesystem/scanner';
import { getSystemQuickTargets } from '../filesystem/quickTargets';
import { getSystemDrives } from '../filesystem/drives';
import { moveToTrash, emptyTrash, openTrash } from '../filesystem/trash';
import { getDiskSpace, getTrashInfo } from '../filesystem/diskSpace';
import type { ScanProgress } from '@shared/models/fileNode';

let activeScanner: FilesystemScanner | null = null;

/**
 * Registers all filesystem and storage-related IPC handlers in the Electron main process.
 */
export function registerFilesystemHandlers(getMainWindow?: () => BrowserWindow | null): void {
  const getTargetWindow = (): BrowserWindow | null => {
    if (typeof getMainWindow === 'function') {
      const win = getMainWindow();
      if (win && !win.isDestroyed()) return win;
    }
    const focused = BrowserWindow.getFocusedWindow();
    if (focused && !focused.isDestroyed()) return focused;
    const all = BrowserWindow.getAllWindows();
    return all.length > 0 && !all[0].isDestroyed() ? all[0] : null;
  };

  // Get Disk Space Information for primary or custom mount
  ipcMain.handle(IPC_CHANNELS.GET_DISK_SPACE, async (_event, targetPath?: string) => {
    return await getDiskSpace(targetPath);
  });

  // Get All Mounted Disks and Storage Volumes
  ipcMain.handle(IPC_CHANNELS.GET_DISKS, async () => {
    try {
      return await getSystemDrives();
    } catch (error) {
      console.error('[Main] Failed to get system disks:', error);
      return [];
    }
  });

  // Get Trash info
  ipcMain.handle(IPC_CHANNELS.GET_TRASH_INFO, async () => {
    return await getTrashInfo();
  });

  // Empty Trash
  ipcMain.handle(IPC_CHANNELS.EMPTY_TRASH, async () => {
    return await emptyTrash();
  });

  // Open / Reveal Trash
  ipcMain.handle(IPC_CHANNELS.OPEN_TRASH, async () => {
    await openTrash();
  });

  // Get Quick Targets (Home, Users, Applications, Downloads, etc.)
  ipcMain.handle(IPC_CHANNELS.GET_QUICK_TARGETS, async () => {
    try {
      return await getSystemQuickTargets();
    } catch (error) {
      console.error('[Main] Failed to get quick targets:', error);
      return [];
    }
  });

  // Select Folder Dialog
  ipcMain.handle(IPC_CHANNELS.SELECT_FOLDER, async () => {
    try {
      const targetWin = getTargetWindow();
      const result = targetWin
        ? await dialog.showOpenDialog(targetWin, {
            properties: ['openDirectory', 'createDirectory'],
            title: 'Select Folder or Disk to Analyze'
          })
        : await dialog.showOpenDialog({
            properties: ['openDirectory', 'createDirectory'],
            title: 'Select Folder or Disk to Analyze'
          });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return result.filePaths[0];
    } catch (error) {
      console.error('[Main] Failed to open folder dialog:', error);
      throw error;
    }
  });

  // Start Asynchronous Filesystem Scan
  ipcMain.handle(IPC_CHANNELS.START_SCAN, async (_event, scanPath: string) => {
    if (!scanPath || typeof scanPath !== 'string') {
      throw new Error('Invalid scan path provided');
    }

    if (activeScanner) {
      activeScanner.cancel();
      activeScanner = null;
    }

    try {
      const scanner = new FilesystemScanner((progress: ScanProgress) => {
        const win = getTargetWindow();
        if (win && !win.isDestroyed() && !scanner.cancelled) {
          win.webContents.send(IPC_CHANNELS.SCAN_PROGRESS, progress);
        }
      });
      activeScanner = scanner;

      const scanResult = await scanner.scan(scanPath);
      
      // If the scan was cancelled, abort emission and discard partial results
      if (scanner.cancelled || activeScanner !== scanner) {
        if (activeScanner === scanner) activeScanner = null;
        return;
      }
      activeScanner = null;

      const win = getTargetWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.SCAN_COMPLETE, scanResult);
      }
    } catch (error: any) {
      activeScanner = null;
      console.error(`[Main] Error scanning path ${scanPath}:`, error);
      const win = getTargetWindow();
      if (win && !win.isDestroyed()) {
        win.webContents.send(IPC_CHANNELS.SCAN_ERROR, {
          path: scanPath,
          message: error?.message || 'Scan failed',
          code: error?.code
        });
      }
      throw error;
    }
  });

  // Cancel Scan
  ipcMain.handle(IPC_CHANNELS.CANCEL_SCAN, async () => {
    if (activeScanner) {
      activeScanner.cancel();
      activeScanner = null;
    }
  });

  // Move to Trash
  ipcMain.handle(IPC_CHANNELS.MOVE_TO_TRASH, async (_event, paths: string[]) => {
    if (!Array.isArray(paths) || paths.length === 0) {
      return { success: true, results: [] };
    }
    return await moveToTrash(paths);
  });

  // Reveal in Finder / File Explorer
  ipcMain.handle(IPC_CHANNELS.REVEAL_IN_FILE_MANAGER, async (_event, itemPath: string) => {
    if (!itemPath || typeof itemPath !== 'string') {
      throw new Error('Invalid path provided to revealInFileManager');
    }
    try {
      shell.showItemInFolder(itemPath);
    } catch (error) {
      console.error(`[Main] Failed to reveal item in file manager: ${itemPath}`, error);
      throw error;
    }
  });

  // Open External URL in default browser
  ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL_URL, async (_event, url: string) => {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      throw new Error('Invalid URL provided to openExternalUrl');
    }
    try {
      await shell.openExternal(url);
    } catch (error) {
      console.error(`[Main] Failed to open external URL: ${url}`, error);
      throw error;
    }
  });

  // Open System Privacy Settings (Full Disk Access on macOS, Windows Settings on Windows)
  ipcMain.handle(IPC_CHANNELS.OPEN_SYSTEM_PRIVACY_SETTINGS, async (_event, target?: string) => {
    if (process.platform === 'darwin') {
      try {
        if (target === 'files-and-folders') {
          await shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_FilesAndFolders');
        } else {
          // Default to Full Disk Access (Privacy_AllFiles) which gives 1-click global disk permission
          await shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles');
        }
      } catch (err) {
        console.error('[Main] Failed to open Privacy settings URL:', err);
        try {
          await shell.openExternal('x-apple.systempreferences:com.apple.preference.security');
        } catch {
          // ignore
        }
      }
    } else if (process.platform === 'win32') {
      try {
        await shell.openExternal('ms-settings:privacy');
      } catch (err) {
        console.error('[Main] Failed to open Windows privacy settings:', err);
      }
    }
  });

  // Get current OS platform
  ipcMain.handle(IPC_CHANNELS.GET_PLATFORM, async () => {
    return process.platform;
  });
}
