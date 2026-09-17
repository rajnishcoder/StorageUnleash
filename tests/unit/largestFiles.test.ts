import { describe, it, expect } from 'vitest';
import { findLargestFiles } from '../../shared/analyzer/largestFiles';
import type { FileNode } from '../../shared/models/fileNode';

describe('findLargestFiles', () => {
  it('finds and sorts files descending by size', () => {
    const root: FileNode = {
      id: 'root',
      name: 'root',
      path: '/root',
      type: 'directory',
      size: 10000,
      children: [
        { id: '1', name: 'small.txt', path: '/root/small.txt', type: 'file', size: 100 },
        { id: '2', name: 'huge.iso', path: '/root/huge.iso', type: 'file', size: 5000 },
        {
          id: 'sub',
          name: 'sub',
          path: '/root/sub',
          type: 'directory',
          size: 4900,
          children: [
            { id: '3', name: 'medium.zip', path: '/root/sub/medium.zip', type: 'file', size: 3000 },
            { id: '4', name: 'tiny.log', path: '/root/sub/tiny.log', type: 'file', size: 50 }
          ]
        }
      ]
    };

    const largest = findLargestFiles(root, 2);
    expect(largest.length).toBe(2);
    expect(largest[0].name).toBe('huge.iso');
    expect(largest[0].size).toBe(5000);
    expect(largest[1].name).toBe('medium.zip');
    expect(largest[1].size).toBe(3000);
  });
});
