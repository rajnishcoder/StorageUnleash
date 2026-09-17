import { describe, it, expect } from 'vitest';
import { computeTreemap } from '../../shared/analyzer/treemap';
import type { FileNode } from '../../shared/models/fileNode';

describe('computeTreemap', () => {
  it('returns empty array if children are empty or zero bounds', () => {
    expect(computeTreemap([], 100, { x: 0, y: 0, width: 800, height: 600 })).toEqual([]);
    expect(computeTreemap(undefined, 100, { x: 0, y: 0, width: 800, height: 600 })).toEqual([]);
    expect(computeTreemap([], 100, { x: 0, y: 0, width: 0, height: 0 })).toEqual([]);
  });

  it('computes squarified layout for single child node', () => {
    const children: FileNode[] = [
      { id: '1', name: 'Videos', path: '/Videos', type: 'directory', size: 1000 }
    ];

    const rects = computeTreemap(children, 1000, { x: 0, y: 0, width: 800, height: 600 });
    expect(rects.length).toBe(1);
    expect(rects[0].name).toBe('Videos');
    expect(rects[0].x).toBe(0);
    expect(rects[0].y).toBe(0);
    expect(rects[0].width).toBe(800);
    expect(rects[0].height).toBe(600);
    expect(rects[0].percentage).toBe(1);
  });

  it('computes squarified layout for multiple children with proper bounds', () => {
    const children: FileNode[] = [
      { id: '1', name: 'Videos', path: '/Videos', type: 'directory', size: 600 },
      { id: '2', name: 'Pictures', path: '/Pictures', type: 'directory', size: 300 },
      { id: '3', name: 'Docs', path: '/Docs', type: 'directory', size: 100 }
    ];

    const rects = computeTreemap(children, 1000, { x: 0, y: 0, width: 1000, height: 1000 });
    expect(rects.length).toBe(3);

    // Sum of rectangle areas equals total area (1,000,000)
    const totalArea = rects.reduce((acc, r) => acc + r.width * r.height, 0);
    expect(Math.round(totalArea)).toBe(1000000);

    // All rectangles inside bounds
    for (const r of rects) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.width).toBeLessThanOrEqual(1000.01);
      expect(r.y + r.height).toBeLessThanOrEqual(1000.01);
    }
  });

  it('aggregates tiny items below threshold into an other group', () => {
    const children: FileNode[] = [
      { id: '1', name: 'Large', path: '/Large', type: 'directory', size: 990 },
      { id: '2', name: 'Tiny1', path: '/Tiny1', type: 'file', size: 2 },
      { id: '3', name: 'Tiny2', path: '/Tiny2', type: 'file', size: 3 },
      { id: '4', name: 'Tiny3', path: '/Tiny3', type: 'file', size: 5 }
    ];

    const rects = computeTreemap(children, 1000, { x: 0, y: 0, width: 800, height: 600 }, {
      minPercentageThreshold: 0.02 // 2%
    });

    const otherRect = rects.find((r) => r.type === 'other');
    expect(otherRect).toBeDefined();
    expect(otherRect?.size).toBe(10);
  });
});
