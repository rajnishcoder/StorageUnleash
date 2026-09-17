import { describe, it, expect } from 'vitest';
import { isNodeHighlighted } from '../../shared/analyzer/filterMatcher';
import type { FileNode } from '../../shared/models/fileNode';

describe('isNodeHighlighted', () => {
  it('identifies node_modules and npm packages when node filter is active', () => {
    const node: FileNode = {
      id: '1',
      name: 'node_modules',
      path: '/Users/rajnish/projects/node_modules',
      type: 'directory',
      size: 50000
    };

    expect(isNodeHighlighted(node, { node: true }, '')).toBe(true);
    expect(isNodeHighlighted(node, { xcode: true }, '')).toBe(false);
  });

  it('identifies disk images when disk_images filter is active', () => {
    const dmgFile: FileNode = {
      id: '2',
      name: 'Cursor-mac.dmg',
      path: '/Users/rajnish/Downloads/Cursor-mac.dmg',
      type: 'file',
      extension: 'dmg',
      size: 150000000
    };

    expect(isNodeHighlighted(dmgFile, { disk_images: true }, '')).toBe(true);
    expect(isNodeHighlighted(dmgFile, { node: true }, '')).toBe(false);
  });

  it('identifies caches and logs when logs_caches filter is active', () => {
    const cacheDir: FileNode = {
      id: '3',
      name: 'Caches',
      path: '/Users/rajnish/Library/Caches',
      type: 'directory',
      size: 5000000000
    };

    expect(isNodeHighlighted(cacheDir, { logs_caches: true }, '')).toBe(true);
  });

  it('matches search query on name and path', () => {
    const file: FileNode = {
      id: '4',
      name: 'StorageUnleash',
      path: '/Users/rajnish/projects/StorageUnleash',
      type: 'directory',
      size: 1000
    };

    expect(isNodeHighlighted(file, {}, 'Storage')).toBe(true);
    expect(isNodeHighlighted(file, {}, 'unleash')).toBe(true);
    expect(isNodeHighlighted(file, {}, 'nonexistent')).toBe(false);
  });
});
