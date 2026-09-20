import { dialog, shell, ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@shared/types/ipc';
import { FilesystemScanner } from '../filesystem/scanner';
import { getSystemQuickTargets } from '../filesystem/quickTargets';
import { moveToTrash, emptyTrash, openTrash } from '../filesystem/trash';
import { getDiskSpace, getTrashInfo } from '../filesystem/diskSpace';
import type { ScanProgress } from '@shared/models/fileNode';

let activeScanner: FilesystemScanner | null = null;

/**
 * Registers all filesystem and storage-related IPC handlers in the Electron main process.
 */
export function registerFilesystemHandlers(mainWindow: BrowserWindow): void {
  // Get Disk Space Information
  ipcMain.handle(IPC_CHANNELS.GET_DISK_SPACE, async () => {
    return await getDiskSpace();
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
      const result = await dialog.showOpenDialog(mainWindow, {
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
      activeScanner = new FilesystemScanner((progress: ScanProgress) => {
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send(IPC_CHANNELS.SCAN_PROGRESS, progress);
        }
      });

      const scanResult = await activeScanner.scan(scanPath);
      activeScanner = null;

      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC_CHANNELS.SCAN_COMPLETE, scanResult);
      }
    } catch (error: any) {
      activeScanner = null;
      console.error(`[Main] Error scanning path ${scanPath}:`, error);
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC_CHANNELS.SCAN_ERROR, {
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

  // Get current OS platform
  ipcMain.handle(IPC_CHANNELS.GET_PLATFORM, async () => {
    return process.platform;
  });
}
