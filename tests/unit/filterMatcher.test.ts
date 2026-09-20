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

  it('identifies photos and RAW files when photos filter is active', () => {
    const photoFile: FileNode = {
      id: 'p-1',
      name: 'DSC_001.CR2',
      path: '/Users/rajnish/Pictures/DSC_001.CR2',
      type: 'file',
      extension: 'cr2',
      size: 35000000
    };

    expect(isNodeHighlighted(photoFile, { photos: true }, '')).toBe(true);
    expect(isNodeHighlighted(photoFile, { videos: true }, '')).toBe(false);
  });

  it('identifies browser caches and web data when browser_caches filter is active', () => {
    const chromeCache: FileNode = {
      id: 'b-1',
      name: 'Chrome',
      path: '/Users/rajnish/Library/Caches/Google/Chrome',
      type: 'directory',
      size: 4500000000
    };

    expect(isNodeHighlighted(chromeCache, { browser_caches: true }, '')).toBe(true);
    expect(isNodeHighlighted(chromeCache, { games: true }, '')).toBe(false);
  });

  it('identifies documents when documents filter is active', () => {
    const docFile: FileNode = {
      id: 'd-1',
      name: 'Tax_Return_2025.pdf',
      path: '/Users/rajnish/Documents/Tax_Return_2025.pdf',
      type: 'file',
      extension: 'pdf',
      size: 5000000
    };

    expect(isNodeHighlighted(docFile, { documents: true }, '')).toBe(true);
    expect(isNodeHighlighted(docFile, { photos: true }, '')).toBe(false);
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

  it('runs efficiently in < 50ms on a 100,000-node tree', () => {
    // Generate 100k nodes
    const children: FileNode[] = [];
    for (let i = 0; i < 1000; i++) {
      const subChildren: FileNode[] = [];
      for (let j = 0; j < 100; j++) {
        subChildren.push({
          id: `file-${i}-${j}`,
          name: `photo_${i}_${j}.jpg`,
          path: `/Users/rajnish/Pictures/photo_${i}_${j}.jpg`,
          type: 'file',
          extension: 'jpg',
          size: 1024 * 1024
        });
      }
      children.push({
        id: `dir-${i}`,
        name: `folder_${i}`,
        path: `/Users/rajnish/Pictures/folder_${i}`,
        type: 'directory',
        size: 100 * 1024 * 1024,
        fileCount: 100,
        children: subChildren
      });
    }

    const largeRoot: FileNode = {
      id: 'root-large',
      name: 'Pictures',
      path: '/Users/rajnish/Pictures',
      type: 'directory',
      size: 1000 * 100 * 1024 * 1024,
      fileCount: 100000,
      children
    };

    const start = performance.now();
    const stats = calculateSmartFilterStats(largeRoot);
    const duration = performance.now() - start;

    expect(stats['photos'].count).toBe(100000);
    expect(duration).toBeLessThan(50); // Must be under 50ms (previously took 4000ms+)
  });
});
