import { describe, it, expect } from 'vitest';
import { isNodeHighlighted, calculateSmartFilterStats } from '../../shared/analyzer/filterMatcher';
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

  it('identifies AI and LLM models when ai_models filter is active', () => {
    const ollamaDir: FileNode = {
      id: 'ai-1',
      name: '.ollama',
      path: '/Users/rajnish/.ollama',
      type: 'directory',
      size: 18000000000
    };

    expect(isNodeHighlighted(ollamaDir, { ai_models: true }, '')).toBe(true);
    expect(isNodeHighlighted(ollamaDir, { node: true }, '')).toBe(false);
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

describe('calculateSmartFilterStats', () => {
  it('aggregates live storage sizes for each smart filter', () => {
    const root: FileNode = {
      id: 'root',
      name: 'Home',
      path: '/Users/rajnish',
      type: 'directory',
      size: 20000000000,
      children: [
        {
          id: 'c1',
          name: '.ollama',
          path: '/Users/rajnish/.ollama',
          type: 'directory',
          size: 18000000000,
          fileCount: 4
        },
        {
          id: 'c2',
          name: 'node_modules',
          path: '/Users/rajnish/project/node_modules',
          type: 'directory',
          size: 1500000000,
          fileCount: 12000
        },
        {
          id: 'c3',
          name: 'installer.dmg',
          path: '/Users/rajnish/Downloads/installer.dmg',
          type: 'file',
          extension: 'dmg',
          size: 500000000
        }
      ]
    };

    const stats = calculateSmartFilterStats(root);
    expect(stats['ai_models'].size).toBe(18000000000);
    expect(stats['ai_models'].count).toBe(4);
    expect(stats['node'].size).toBe(1500000000);
    expect(stats['disk_images'].size).toBe(500000000);
    expect(stats['xcode'].size).toBe(0);
    expect(stats['xcode'].count).toBe(0);
  });
});
