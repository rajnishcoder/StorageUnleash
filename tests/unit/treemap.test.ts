import { describe, it, expect } from 'vitest';
import { computeHierarchicalTreemap } from '../../shared/analyzer/treemap';
import type { FileNode } from '../../shared/models/fileNode';

describe('computeHierarchicalTreemap', () => {
  it('returns empty array if children are empty or zero bounds', () => {
    const root: FileNode = { id: '0', name: 'root', path: '/', type: 'directory', size: 100, children: [] };
    expect(computeHierarchicalTreemap(root, { x: 0, y: 0, width: 800, height: 600 })).toEqual([]);
    expect(computeHierarchicalTreemap(undefined, { x: 0, y: 0, width: 800, height: 600 })).toEqual([]);
    expect(computeHierarchicalTreemap(root, { x: 0, y: 0, width: 0, height: 0 })).toEqual([]);
  });

  it('computes hierarchical layout for single child node', () => {
    const root: FileNode = {
      id: '0',
      name: 'root',
      path: '/',
      type: 'directory',
      size: 1000,
      children: [
        { id: '1', name: 'Videos', path: '/Videos', type: 'file', size: 1000 }
      ]
    };

    const rects = computeHierarchicalTreemap(root, { x: 0, y: 0, width: 800, height: 600 });
    expect(rects.length).toBe(1);
    expect(rects[0].name).toBe('Videos');
    expect(rects[0].x).toBe(0);
    expect(rects[0].y).toBe(0);
    expect(rects[0].width).toBe(800);
    expect(rects[0].height).toBe(600);
  });

  it('computes 2D squarified tiles without stripe degeneration', () => {
    const root: FileNode = {
      id: '0',
      name: 'root',
      path: '/',
      type: 'directory',
      size: 1000,
      children: [
        { id: '1', name: 'A', path: '/A', type: 'file', size: 500 },
        { id: '2', name: 'B', path: '/B', type: 'file', size: 250 },
        { id: '3', name: 'C', path: '/C', type: 'file', size: 250 }
      ]
    };

    const rects = computeHierarchicalTreemap(root, { x: 0, y: 0, width: 1000, height: 1000 });
    expect(rects.length).toBe(3);

    const totalArea = rects.reduce((acc, r) => acc + r.width * r.height, 0);
    expect(Math.round(totalArea)).toBe(1000000);
  });

  it('computes nested recursive children for directory nodes', () => {
    const root: FileNode = {
      id: '0',
      name: 'root',
      path: '/',
      type: 'directory',
      size: 2000,
      children: [
        {
          id: '1',
          name: 'Library',
          path: '/Library',
          type: 'directory',
          size: 1500,
          children: [
            { id: '1a', name: 'Caches', path: '/Library/Caches', type: 'file', size: 1000 },
            { id: '1b', name: 'AppSupport', path: '/Library/AppSupport', type: 'file', size: 500 }
          ]
        },
        { id: '2', name: 'Downloads', path: '/Downloads', type: 'file', size: 500 }
      ]
    };

    const rects = computeHierarchicalTreemap(root, { x: 0, y: 0, width: 1000, height: 800 }, 0, 3);
    expect(rects.length).toBe(2);

    const libraryTile = rects.find((r) => r.name === 'Library');
    expect(libraryTile).toBeDefined();
    expect(libraryTile?.children).toBeDefined();
    expect(libraryTile?.children?.length).toBe(2);
  });

  it('handles 0-byte files gracefully without returning empty array or freezing', () => {
    const root: FileNode = {
      id: '0',
      name: 'Documents',
      path: 'C:\\Users\\user\\Documents',
      type: 'directory',
      size: 0,
      children: [
        { id: '1', name: 'notes.txt', path: 'C:\\Users\\user\\Documents\\notes.txt', type: 'file', size: 0 },
        { id: '2', name: 'draft.docx', path: 'C:\\Users\\user\\Documents\\draft.docx', type: 'file', size: 0 }
      ]
    };

    const rects = computeHierarchicalTreemap(root, { x: 0, y: 0, width: 800, height: 600 });
    expect(rects.length).toBe(2);
    expect(rects[0].width).toBeGreaterThan(0);
    expect(rects[0].height).toBeGreaterThan(0);
  });

  it('prevents infinite loops in circular or deep single-child chains', () => {
    const childNode: FileNode = {
      id: 'child',
      name: 'nested',
      path: '/root/nested',
      type: 'directory',
      size: 100,
      children: []
    };
    // Create self-referential circular child
    childNode.children = [childNode];

    const root: FileNode = {
      id: 'root',
      name: 'root',
      path: '/root',
      type: 'directory',
      size: 100,
      children: [childNode]
    };

    const rects = computeHierarchicalTreemap(root, { x: 0, y: 0, width: 800, height: 600 });
    expect(rects.length).toBeGreaterThan(0);
  });
});
