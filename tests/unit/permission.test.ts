import { describe, it, expect } from 'vitest';
import type { FileNode, ScanResult } from '../../shared/models/fileNode';

describe('Permission Denied Model & Handling', () => {
  it('identifies directory node marked with permissionDenied', () => {
    const node: FileNode = {
      id: '/Users/test/Downloads',
      name: 'Downloads',
      path: '/Users/test/Downloads',
      type: 'directory',
      size: 0,
      children: [],
      permissionDenied: true,
      errorCode: 'EPERM'
    };

    expect(node.permissionDenied).toBe(true);
    expect(node.errorCode).toBe('EPERM');
  });

  it('marks scanResult with hasPermissionError flag when permission is denied', () => {
    const rootNode: FileNode = {
      id: '/Users/test/Documents',
      name: 'Documents',
      path: '/Users/test/Documents',
      type: 'directory',
      size: 0,
      children: [],
      permissionDenied: true,
      errorCode: 'EACCES'
    };

    const scanResult: ScanResult = {
      root: rootNode,
      totalSize: 0,
      totalFiles: 0,
      totalDirectories: 1,
      durationMs: 4,
      errors: [
        {
          path: '/Users/test/Documents',
          code: 'EACCES',
          message: 'permission denied'
        }
      ],
      hasPermissionError: true
    };

    expect(scanResult.hasPermissionError).toBe(true);
    expect(scanResult.root.permissionDenied).toBe(true);
    expect(scanResult.errors.some((e) => e.code === 'EACCES')).toBe(true);
  });
});
