import type { ScanProgress, ScanResult, ScanError, TrashResult } from '../models/fileNode';

export interface QuickTarget {
  id: string;
  name: string;
  path: string;
  iconType: 'home' | 'users' | 'applications' | 'downloads' | 'documents' | 'desktop' | 'disk';
  description?: string;
}

export interface DiskSpaceInfo {
  total: number;
  used: number;
  free: number;
  percentage: number;
  mount: string;
}

export interface TrashInfo {
  itemCount: number;
  totalSize: number;
}

export interface AppUpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName?: string;
  releaseNotes?: string;
  releaseDate?: string;
  downloadUrl: string;
  releaseUrl: string;
}

/**
 * IPC channel names constants.
 */
export const IPC_CHANNELS = {
  // Disk & Quick targets
  GET_DISK_SPACE: 'storage:get-disk-space',
  GET_QUICK_TARGETS: 'storage:get-quick-targets',
  SELECT_FOLDER: 'storage:select-folder',
  GET_TRASH_INFO: 'storage:get-trash-info',
  EMPTY_TRASH: 'storage:empty-trash',
  OPEN_TRASH: 'storage:open-trash',
  
  // Scanning operations
  START_SCAN: 'storage:start-scan',
  CANCEL_SCAN: 'storage:cancel-scan',
  
  // Progress & Event channels (Main -> Renderer)
  SCAN_PROGRESS: 'storage:scan-progress',
  SCAN_COMPLETE: 'storage:scan-complete',
  SCAN_ERROR: 'storage:scan-error',
  
  // File & External operations
  REVEAL_IN_FILE_MANAGER: 'storage:reveal-in-file-manager',
  MOVE_TO_TRASH: 'storage:move-to-trash',
  OPEN_EXTERNAL_URL: 'storage:open-external-url',
  
  // System metadata & updates
  GET_PLATFORM: 'storage:get-platform',
  CHECK_FOR_UPDATES: 'storage:check-for-updates'
} as const;

export type IPCChannelName = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];

/**
 * Typed storage API exposed to renderer window.storageAPI.
 */
export interface StorageAPI {
  getDiskSpace(): Promise<DiskSpaceInfo>;
  getQuickTargets(): Promise<QuickTarget[]>;
  getTrashInfo(): Promise<TrashInfo>;
  emptyTrash(): Promise<boolean>;
  openTrash(): Promise<void>;
  selectFolder(): Promise<string | null>;
  startScan(path: string): Promise<void>;
  cancelScan(): Promise<void>;
  revealInFileManager(path: string): Promise<void>;
  moveToTrash(paths: string[]): Promise<TrashResult>;
  openExternalUrl(url: string): Promise<void>;
  getPlatform(): Promise<string>;
  checkForUpdates(): Promise<AppUpdateInfo>;
  onScanProgress(callback: (progress: ScanProgress) => void): () => void;
  onScanComplete(callback: (result: ScanResult) => void): () => void;
  onScanError(callback: (error: ScanError) => void): () => void;
}
