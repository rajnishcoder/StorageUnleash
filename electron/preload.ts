import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { IPC_CHANNELS, StorageAPI, QuickTarget, DiskSpaceInfo, TrashInfo } from '@shared/types/ipc';
import type { ScanProgress, ScanResult, ScanError, TrashResult } from '@shared/models/fileNode';

const storageAPI: StorageAPI = {
  getDiskSpace: (): Promise<DiskSpaceInfo> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_DISK_SPACE);
  },

  getQuickTargets: (): Promise<QuickTarget[]> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_QUICK_TARGETS);
  },

  getTrashInfo: (): Promise<TrashInfo> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_TRASH_INFO);
  },

  emptyTrash: (): Promise<boolean> => {
    return ipcRenderer.invoke(IPC_CHANNELS.EMPTY_TRASH);
  },

  openTrash: (): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.OPEN_TRASH);
  },

  selectFolder: (): Promise<string | null> => {
    return ipcRenderer.invoke(IPC_CHANNELS.SELECT_FOLDER);
  },

  startScan: (path: string): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.START_SCAN, path);
  },

  cancelScan: (): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CANCEL_SCAN);
  },

  revealInFileManager: (path: string): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.REVEAL_IN_FILE_MANAGER, path);
  },

  moveToTrash: (paths: string[]): Promise<TrashResult> => {
    return ipcRenderer.invoke(IPC_CHANNELS.MOVE_TO_TRASH, paths);
  },

  openExternalUrl: (url: string): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.OPEN_EXTERNAL_URL, url);
  },

  getPlatform: (): Promise<string> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_PLATFORM);
  },

  onScanProgress: (callback: (progress: ScanProgress) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, progress: ScanProgress) => callback(progress);
    ipcRenderer.on(IPC_CHANNELS.SCAN_PROGRESS, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.SCAN_PROGRESS, handler);
  },

  onScanComplete: (callback: (result: ScanResult) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, result: ScanResult) => callback(result);
    ipcRenderer.on(IPC_CHANNELS.SCAN_COMPLETE, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.SCAN_COMPLETE, handler);
  },

  onScanError: (callback: (error: ScanError) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, error: ScanError) => callback(error);
    ipcRenderer.on(IPC_CHANNELS.SCAN_ERROR, handler);
    return () => ipcRenderer.removeListener(IPC_CHANNELS.SCAN_ERROR, handler);
  }
};

// Expose strictly typed storageAPI to Renderer process
contextBridge.exposeInMainWorld('storageAPI', storageAPI);
