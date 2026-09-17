import { dialog, shell, ipcMain, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '@shared/types/ipc';

/**
 * Registers all filesystem and storage-related IPC handlers in the Electron main process.
 */
export function registerFilesystemHandlers(mainWindow: BrowserWindow): void {
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

  // Placeholder handlers for next milestones
  ipcMain.handle(IPC_CHANNELS.START_SCAN, async (_event, path: string) => {
    console.log(`[Main] Scan requested for path: ${path} (Scanner will be implemented in Milestone 2)`);
  });

  ipcMain.handle(IPC_CHANNELS.CANCEL_SCAN, async () => {
    console.log('[Main] Scan cancellation requested');
  });

  ipcMain.handle(IPC_CHANNELS.MOVE_TO_TRASH, async (_event, paths: string[]) => {
    console.log('[Main] Move to trash requested for:', paths);
    return {
      success: true,
      results: paths.map(p => ({ path: p, success: true }))
    };
  });
}
