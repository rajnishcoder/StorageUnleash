/**
 * Core filesystem models and types for StorageUnleash.
 * Completely decoupled from Electron and DOM APIs.
 */

export type FileNodeType = 'file' | 'directory';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: FileNodeType;
  size: number;
  allocatedSize?: number;
  modifiedAt?: number;
  extension?: string;
  children?: FileNode[];
  fileCount?: number;
  directoryCount?: number;
}

export interface ScanProgress {
  filesScanned: number;
  directoriesScanned: number;
  bytesProcessed?: number;
  currentPath?: string;
  percentage?: number;
}

export interface ScanError {
  path: string;
  code?: string;
  message: string;
}

export interface ScanResult {
  root: FileNode;
  totalSize: number;
  totalFiles: number;
  totalDirectories: number;
  durationMs: number;
  errors: ScanError[];
}

export interface TrashItemResult {
  path: string;
  success: boolean;
  error?: string;
}

export interface TrashResult {
  success: boolean;
  results: TrashItemResult[];
  totalBytesFreed?: number;
}

export type FileCategory =
  | 'video'
  | 'image'
  | 'audio'
  | 'document'
  | 'archive'
  | 'application'
  | 'code'
  | 'other';
