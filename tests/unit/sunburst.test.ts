import { describe, it, expect } from 'vitest';
import {
  computeSunburstLayout,
  polarToCartesian,
  describeArc
} from '../../shared/analyzer/sunburst';
import type { FileNode } from '../../shared/models/fileNode';

describe('Sunburst Layout Algorithm', () => {
  it('computes polarToCartesian correctly for 0 and PI/2 radians', () => {
    // 0 radians (12 o'clock, x=100, y=50 for r=50)
    const p12 = polarToCartesian(100, 100, 50, 0);
    expect(Math.round(p12.x)).toBe(100);
    expect(Math.round(p12.y)).toBe(50);

    // PI/2 radians (3 o'clock, x=150, y=100 for r=50)
    const p3 = polarToCartesian(100, 100, 50, Math.PI / 2);
    expect(Math.round(p3.x)).toBe(150);
    expect(Math.round(p3.y)).toBe(100);
  });

  it('generates valid SVG path strings for annular arcs', () => {
    const path = describeArc(100, 100, 20, 50, 0, Math.PI);
    expect(path).toContain('M ');
    expect(path).toContain('A 50 50');
    expect(path).toContain('L ');
    expect(path).toContain('A 20 20');
    expect(path).toContain('Z');
  });

  it('computes multi-depth sunburst arcs proportional to file sizes', () => {
    const mockTree: FileNode = {
      id: 'root',
      name: 'Macintosh HD',
      path: '/Macintosh HD',
      type: 'directory',
      size: 10000000000,
      children: [
        {
          id: 'system',
          name: 'System',
          path: '/Macintosh HD/System',
          type: 'directory',
          size: 5000000000, // 50%
          children: [
            {
              id: 'sys-lib',
              name: 'Library',
              path: '/Macintosh HD/System/Library',
              type: 'directory',
              size: 5000000000
            }
          ]
        },
        {
          id: 'users',
          name: 'Users',
          path: '/Macintosh HD/Users',
          type: 'directory',
          size: 3000000000 // 30%
        },
        {
          id: 'apps',
          name: 'Applications',
          path: '/Macintosh HD/Applications',
          type: 'directory',
          size: 2000000000 // 20%
        }
      ]
    };

    const layout = computeSunburstLayout(mockTree, 500, 500, 3);

    expect(layout.centerX).toBe(250);
    expect(layout.centerY).toBe(250);
    expect(layout.arcs.length).toBeGreaterThanOrEqual(4);

    // Level 1 arcs
    const level1Arcs = layout.arcs.filter((a) => a.depth === 1);
    expect(level1Arcs.length).toBe(3);

    const systemArc = level1Arcs.find((a) => a.node.name === 'System');
    expect(systemArc).toBeDefined();
    // System is 50%, angle span should be ~PI radians
    const span = (systemArc!.endAngle - systemArc!.startAngle);
    expect(span).toBeCloseTo(Math.PI, 1);

    // Level 2 arc
    const level2Arcs = layout.arcs.filter((a) => a.depth === 2);
    expect(level2Arcs.length).toBe(1);
    expect(level2Arcs[0].node.name).toBe('Library');
  });

  it('handles empty or single file nodes gracefully without throwing', () => {
    const emptyLayout = computeSunburstLayout(null, 400, 400);
    expect(emptyLayout.arcs).toEqual([]);

    const singleNode: FileNode = {
      id: 'f1',
      name: 'file.txt',
      path: '/file.txt',
      type: 'file',
      size: 100
    };

    const singleLayout = computeSunburstLayout(singleNode, 400, 400);
    expect(singleLayout.arcs).toEqual([]);
  });
});
