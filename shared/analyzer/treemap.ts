import type { FileNode } from '../models/fileNode';

export interface TreemapRect {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory' | 'other';
  size: number;
  percentage: number;
  x: number;
  y: number;
  width: number;
  height: number;
  node?: FileNode;
  itemCount?: number;
}

export interface TreemapOptions {
  minPercentageThreshold?: number; // e.g. 0.005 (0.5%)
  maxItems?: number; // max distinct rectangles before grouping
}

/**
 * Calculates squarified treemap layout for children of a given directory node.
 */
export function computeTreemap(
  children: FileNode[] | undefined,
  totalParentSize: number,
  bounds: { x: number; y: number; width: number; height: number },
  options: TreemapOptions = {}
): TreemapRect[] {
  if (!children || children.length === 0 || bounds.width <= 0 || bounds.height <= 0) {
    return [];
  }

  const { minPercentageThreshold = 0.005, maxItems = 40 } = options;

  // Filter out zero-size items and sort descending
  const validChildren = children
    .filter((c) => c.size > 0)
    .sort((a, b) => b.size - a.size);

  if (validChildren.length === 0) {
    return [];
  }

  const totalSum = totalParentSize > 0 ? totalParentSize : validChildren.reduce((s, c) => s + c.size, 0);
  if (totalSum <= 0) return [];

  const mainItems: FileNode[] = [];
  const otherItems: FileNode[] = [];

  for (let i = 0; i < validChildren.length; i++) {
    const child = validChildren[i];
    const pct = child.size / totalSum;

    if (i < maxItems && pct >= minPercentageThreshold) {
      mainItems.push(child);
    } else {
      otherItems.push(child);
    }
  }

  const layoutNodes: Array<{ node?: FileNode; size: number; isOther?: boolean; otherCount?: number }> = mainItems.map(
    (node) => ({ node, size: node.size })
  );

  if (otherItems.length > 0) {
    const otherSize = otherItems.reduce((acc, it) => acc + it.size, 0);
    if (otherSize > 0) {
      layoutNodes.push({
        size: otherSize,
        isOther: true,
        otherCount: otherItems.length
      });
    }
  }

  const rects: TreemapRect[] = [];
  const totalArea = bounds.width * bounds.height;
  const layoutSum = layoutNodes.reduce((acc, item) => acc + item.size, 0);

  if (layoutSum <= 0) return [];

  const areas = layoutNodes.map((item) => ({
    ...item,
    area: (item.size / layoutSum) * totalArea
  }));

  squarify(areas, [], { ...bounds }, rects, totalSum);

  return rects;
}

interface AreaItem {
  node?: FileNode;
  size: number;
  area: number;
  isOther?: boolean;
  otherCount?: number;
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function squarify(
  children: AreaItem[],
  row: AreaItem[],
  bounds: Bounds,
  results: TreemapRect[],
  totalSum: number
): void {
  if (children.length === 0) {
    layoutRow(row, bounds, results, totalSum);
    return;
  }

  const c = children[0];
  if (row.length === 0) {
    squarify(children.slice(1), [c], bounds, results, totalSum);
    return;
  }

  const sideLength = Math.min(bounds.width, bounds.height);
  if (worst(row, sideLength) <= worst([...row, c], sideLength)) {
    squarify(children.slice(1), [...row, c], bounds, results, totalSum);
  } else {
    const remainingBounds = layoutRow(row, bounds, results, totalSum);
    squarify(children, [], remainingBounds, results, totalSum);
  }
}

function worst(row: AreaItem[], sideLength: number): number {
  if (row.length === 0 || sideLength <= 0) return Infinity;
  const rowArea = row.reduce((s, it) => s + it.area, 0);
  if (rowArea <= 0) return Infinity;

  let maxArea = -Infinity;
  let minArea = Infinity;

  for (const item of row) {
    if (item.area > maxArea) maxArea = item.area;
    if (item.area < minArea) minArea = item.area;
  }

  const s2 = sideLength * sideLength;
  const r2 = rowArea * rowArea;

  return Math.max((s2 * maxArea) / r2, r2 / (s2 * minArea));
}

function layoutRow(
  row: AreaItem[],
  bounds: Bounds,
  results: TreemapRect[],
  totalSum: number
): Bounds {
  if (row.length === 0) return bounds;

  const isHorizontal = bounds.width >= bounds.height;
  const rowArea = row.reduce((s, it) => s + it.area, 0);
  const sideLength = Math.min(bounds.width, bounds.height);

  const rowThickness = sideLength > 0 ? rowArea / sideLength : 0;

  let currentPos = isHorizontal ? bounds.y : bounds.x;

  for (const item of row) {
    const itemLength = rowThickness > 0 ? item.area / rowThickness : 0;
    const pct = totalSum > 0 ? item.size / totalSum : 0;

    let rect: TreemapRect;

    if (isHorizontal) {
      rect = {
        id: item.isOther ? 'other-group' : (item.node?.id || item.node?.path || Math.random().toString()),
        name: item.isOther ? `Other (${item.otherCount} items)` : (item.node?.name || 'Unnamed'),
        path: item.node?.path || '',
        type: item.isOther ? 'other' : (item.node?.type || 'file'),
        size: item.size,
        percentage: pct,
        x: bounds.x,
        y: currentPos,
        width: rowThickness,
        height: itemLength,
        node: item.node,
        itemCount: item.isOther ? item.otherCount : item.node?.fileCount
      };
      currentPos += itemLength;
    } else {
      rect = {
        id: item.isOther ? 'other-group' : (item.node?.id || item.node?.path || Math.random().toString()),
        name: item.isOther ? `Other (${item.otherCount} items)` : (item.node?.name || 'Unnamed'),
        path: item.node?.path || '',
        type: item.isOther ? 'other' : (item.node?.type || 'file'),
        size: item.size,
        percentage: pct,
        x: currentPos,
        y: bounds.y,
        width: itemLength,
        height: rowThickness,
        node: item.node,
        itemCount: item.isOther ? item.otherCount : item.node?.fileCount
      };
      currentPos += itemLength;
    }

    results.push(rect);
  }

  if (isHorizontal) {
    return {
      x: bounds.x + rowThickness,
      y: bounds.y,
      width: Math.max(0, bounds.width - rowThickness),
      height: bounds.height
    };
  } else {
    return {
      x: bounds.x,
      y: bounds.y + rowThickness,
      width: bounds.width,
      height: Math.max(0, bounds.height - rowThickness)
    };
  }
}
