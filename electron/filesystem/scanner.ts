import fs from 'node:fs';
import path from 'node:path';
import type { FileNode, ScanProgress, ScanResult, ScanError } from '@shared/models/fileNode';

export class FilesystemScanner {
  private isCancelled: boolean = false;
  private filesScanned: number = 0;
  private directoriesScanned: number = 0;
  private bytesProcessed: number = 0;
  private currentPath: string = '';
  private errors: ScanError[] = [];
  private visitedRealPaths: Set<string> = new Set();
  
  private progressCallback?: (progress: ScanProgress) => void;
  private lastProgressTime: number = 0;
  private readonly progressThrottleMs: number = 60;

  constructor(onProgress?: (progress: ScanProgress) => void) {
    this.progressCallback = onProgress;
  }

  public cancel(): void {
    this.isCancelled = true;
  }

  public async scan(rootPath: string): Promise<ScanResult> {
    const startTime = Date.now();
    this.isCancelled = false;
    this.filesScanned = 0;
    this.directoriesScanned = 0;
    this.bytesProcessed = 0;
    this.errors = [];
    this.visitedRealPaths.clear();

    const normalizedRoot = path.resolve(rootPath);
    const rootNode = await this.scanDirectory(normalizedRoot, path.basename(normalizedRoot) || normalizedRoot);

    // Final progress emission
    if (this.progressCallback && !this.isCancelled) {
      this.progressCallback({
        filesScanned: this.filesScanned,
        directoriesScanned: this.directoriesScanned,
        bytesProcessed: this.bytesProcessed,
        currentPath: 'Scan completed',
        percentage: 100
      });
    }

    return {
      root: rootNode,
      totalSize: rootNode.size,
      totalFiles: rootNode.fileCount || this.filesScanned,
      totalDirectories: rootNode.directoryCount || this.directoriesScanned,
      durationMs: Date.now() - startTime,
      errors: this.errors
    };
  }

  private emitProgress(force: boolean = false): void {
    if (!this.progressCallback) return;
    const now = Date.now();
    if (force || now - this.lastProgressTime >= this.progressThrottleMs) {
      this.lastProgressTime = now;
      this.progressCallback({
        filesScanned: this.filesScanned,
        directoriesScanned: this.directoriesScanned,
        bytesProcessed: this.bytesProcessed,
        currentPath: this.currentPath
      });
    }
  }

  private async scanDirectory(dirPath: string, name: string): Promise<FileNode> {
    this.directoriesScanned++;
    this.currentPath = dirPath;
    this.emitProgress();

    const node: FileNode = {
      id: dirPath,
      name,
      path: dirPath,
      type: 'directory',
      size: 0,
      children: [],
      fileCount: 0,
      directoryCount: 0
    };

    if (this.isCancelled) return node;

    // Check symlink recursion / realpath
    try {
      const real = await fs.promises.realpath(dirPath);
      if (this.visitedRealPaths.has(real)) {
        // Detected symlink cycle or already visited real path
        return node;
      }
      this.visitedRealPaths.add(real);
    } catch (err: any) {
      // If realpath fails (e.g. permission or special file), record non-fatal error
      this.recordError(dirPath, err);
    }

    let entries: fs.Dirent[] = [];
    try {
      entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    } catch (err: any) {
      this.recordError(dirPath, err);
      return node;
    }

    let totalDirSize = 0;
    let totalFileCount = 0;
    let totalDirectoryCount = 0;
    const childrenNodes: FileNode[] = [];

    for (const entry of entries) {
      if (this.isCancelled) break;

      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const childDirNode = await this.scanDirectory(fullPath, entry.name);
        childrenNodes.push(childDirNode);
        totalDirSize += childDirNode.size;
        totalFileCount += childDirNode.fileCount || 0;
        totalDirectoryCount += 1 + (childDirNode.directoryCount || 0);
      } else if (entry.isSymbolicLink()) {
        try {
          const stats = await fs.promises.stat(fullPath);
          if (stats.isDirectory()) {
            // Avoid traversing arbitrary directory symlinks to prevent duplicate accounting
            const linkNode: FileNode = {
              id: fullPath,
              name: entry.name,
              path: fullPath,
              type: 'directory',
              size: stats.size || 0,
              fileCount: 0,
              directoryCount: 0
            };
            childrenNodes.push(linkNode);
            totalDirSize += linkNode.size;
            totalDirectoryCount += 1;
          } else {
            const ext = path.extname(entry.name).replace(/^\./, '').toLowerCase();
            const linkFileNode: FileNode = {
              id: fullPath,
              name: entry.name,
              path: fullPath,
              type: 'file',
              size: stats.size || 0,
              extension: ext,
              modifiedAt: stats.mtimeMs
            };
            childrenNodes.push(linkFileNode);
            totalDirSize += linkFileNode.size;
            totalFileCount += 1;
            this.filesScanned++;
            this.bytesProcessed += stats.size || 0;
          }
        } catch (err: any) {
          // Broken symlink
          this.recordError(fullPath, err);
        }
      } else if (entry.isFile()) {
        try {
          const stats = await fs.promises.stat(fullPath);
          const ext = path.extname(entry.name).replace(/^\./, '').toLowerCase();
          const fileNode: FileNode = {
            id: fullPath,
            name: entry.name,
            path: fullPath,
            type: 'file',
            size: stats.size,
            extension: ext,
            modifiedAt: stats.mtimeMs
          };

          childrenNodes.push(fileNode);
          totalDirSize += stats.size;
          totalFileCount += 1;
          this.filesScanned++;
          this.bytesProcessed += stats.size;
          this.emitProgress();
        } catch (err: any) {
          this.recordError(fullPath, err);
        }
      }
    }

    // Sort children descending by size
    childrenNodes.sort((a, b) => b.size - a.size);

    node.size = totalDirSize;
    node.children = childrenNodes;
    node.fileCount = totalFileCount;
    node.directoryCount = totalDirectoryCount;

    return node;
  }

  private recordError(itemPath: string, error: any): void {
    this.errors.push({
      path: itemPath,
      code: error?.code || 'UNKNOWN',
      message: error?.message || 'Access error during scan'
    });
  }
}
