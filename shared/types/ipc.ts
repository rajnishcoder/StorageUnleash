import type { ScanProgress, ScanResult, ScanError, TrashResult } from '../models/fileNode';

export interface QuickTarget {
  id: string;
  name: string;
  path: string;
  iconType: 'home' | 'users' | 'applications' | 'downloads' | 'documents' | 'desktop' | 'disk';
  description?: string;
}

/**
 * IPC channel names constants.
 */
export const IPC_CHANNELS = {
  // Quick targets & Folder selection
  GET_QUICK_TARGETS: 'storage:get-quick-targets',
  SELECT_FOLDER: 'storage:select-folder',
  
  // Scanning operations
  START_SCAN: 'storage:start-scan',
  CANCEL_SCAN: 'storage:cancel-scan',
  
  // Progress & Event channels (Main -> Renderer)
  SCAN_PROGRESS: 'storage:scan-progress',
  SCAN_COMPLETE: 'storage:scan-complete',
  SCAN_ERROR: 'storage:scan-error',
  
  // File operations
  REVEAL_IN_FILE_MANAGER: 'storage:reveal-in-file-manager',
  MOVE_TO_TRASH: 'storage:move-to-trash',
  
  // System metadata
  GET_PLATFORM: 'storage:get-platform'
} as const;

export type IPCChannelName = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS];

/**
 * Typed storage API exposed to renderer window.storageAPI.
 */
export interface StorageAPI {
  /**
   * Retrieves default quick access targets for the current operating system.
   */
  getQuickTargets(): Promise<QuickTarget[]>;

  /**
   * Opens native directory selection dialog.
   * Returns the selected folder path or null if cancelled.
   */
  selectFolder(): Promise<string | null>;

  /**
   * Starts an asynchronous filesystem scan for the specified directory.
   */
  startScan(path: string): Promise<void>;

  /**
   * Requests cancellation of the currently active filesystem scan.
   */
  cancelScan(): Promise<void>;

  /**
   * Reveals a specific file or directory in Finder (macOS) or File Explorer (Windows).
   */
  revealInFileManager(path: string): Promise<void>;

  /**
   * Safely moves the given paths to macOS Trash or Windows Recycle Bin.
   */
  moveToTrash(paths: string[]): Promise<TrashResult>;

  /**
   * Returns the current operating system platform ('darwin' | 'win32' | 'linux').
   */
  getPlatform(): Promise<string>;

  /**
   * Subscribes to ongoing scan progress events.
   * Returns an unsubscribe cleanup function.
   */
  onScanProgress(callback: (progress: ScanProgress) => void): () => void;

  /**
   * Subscribes to the scan completion event.
   * Returns an unsubscribe cleanup function.
   */
  onScanComplete(callback: (result: ScanResult) => void): () => void;

  /**
   * Subscribes to scan error events.
   * Returns an unsubscribe cleanup function.
   */
  onScanError(callback: (error: ScanError) => void): () => void;
}
