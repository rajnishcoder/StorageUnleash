import type { FileNode } from '../models/fileNode';

export interface TreemapRect {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory' | 'other';
  size: number;
  percentage: number;
  depth: number;
  x: number;
  y: number;
  width: number;
  height: number;
  node?: FileNode;
  children?: TreemapRect[];
  colorIndex: number;
  collapsedHeaders?: string[];
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ItemWithSize {
  node?: FileNode;
  size: number;
  isOther?: boolean;
  otherCount?: number;
}

/**
 * Computes a multi-level hierarchical nested squarified treemap matching DissectMac.
 */
export function computeHierarchicalTreemap(
  node: FileNode | undefined,
  bounds: Bounds,
  depth: number = 0,
  maxDepth: number = 4,
  colorIndex: number = 0
): TreemapRect[] {
  if (!node || !node.children || node.children.length === 0 || bounds.width <= 6 || bounds.height <= 6) {
    return [];
  }

  // Filter positive-size children and sort descending
  const validChildren = node.children
    .filter((c) => c.size > 0)
    .sort((a, b) => b.size - a.size);

  if (validChildren.length === 0) return [];

  const totalSum = validChildren.reduce((acc, c) => acc + c.size, 0);
  if (totalSum <= 0) return [];

  const minThreshold = depth === 0 ? 0.003 : (depth === 1 ? 0.006 : 0.012);
  const maxItems = depth === 0 ? 30 : 20;

  const mainItems: FileNode[] = [];
  const otherItems: FileNode[] = [];

  for (let i = 0; i < validChildren.length; i++) {
    const child = validChildren[i];
    const pct = child.size / totalSum;
    if (i < maxItems && pct >= minThreshold) {
      mainItems.push(child);
    } else {
      otherItems.push(child);
    }
  }

  const itemsToLayout: ItemWithSize[] = mainItems.map((n) => ({
    node: n,
    size: n.size
  }));

  if (otherItems.length > 0) {
    const otherSize = otherItems.reduce((acc, it) => acc + it.size, 0);
    if (otherSize > 0) {
      itemsToLayout.push({
        size: otherSize,
        isOther: true,
        otherCount: otherItems.length
      });
    }
  }

  const rects = squarify(itemsToLayout, bounds, totalSum, depth, colorIndex);

  // Recursively layout children inside directory tiles
  for (let i = 0; i < rects.length; i++) {
    const rect = rects[i];
    if (
      rect.type === 'directory' &&
      rect.node &&
      rect.node.children &&
      rect.node.children.length > 0 &&
      depth < maxDepth &&
      rect.width >= 55 &&
      rect.height >= 45
    ) {
      // Check for single-child chain compression (e.g. .ollama -> models -> blobs)
      let targetNode = rect.node;
      const collapsed: string[] = [targetNode.name];

      while (
        targetNode.children &&
        targetNode.children.length === 1 &&
        targetNode.children[0].type === 'directory' &&
        targetNode.children[0].children &&
        targetNode.children[0].children.length > 0
      ) {
        targetNode = targetNode.children[0];
        collapsed.push(targetNode.name);
      }

      rect.collapsedHeaders = collapsed;

      const headerHeight = Math.min(22 * collapsed.length, Math.floor(rect.height * 0.45));
      const pad = 2;

      const innerBounds: Bounds = {
        x: rect.x + pad,
        y: rect.y + headerHeight + 1,
        width: Math.max(0, rect.width - pad * 2),
        height: Math.max(0, rect.height - headerHeight - pad - 1)
      };

      if (innerBounds.width >= 10 && innerBounds.height >= 10) {
        const nextColorIdx = depth === 0 ? i : (colorIndex * 3 + i + 1) % 12;
        rect.children = computeHierarchicalTreemap(
          targetNode,
          innerBounds,
          depth + 1,
          maxDepth,
          nextColorIdx
        );
      }
    }
  }

  return rects;
}

/**
 * Standard Squarified Treemap implementation (Bruls et al.)
 */
function squarify(
  items: ItemWithSize[],
  bounds: Bounds,
  totalSum: number,
  depth: number,
  colorIndex: number
): TreemapRect[] {
  if (items.length === 0 || bounds.width <= 0 || bounds.height <= 0 || totalSum <= 0) {
    return [];
  }

  const results: TreemapRect[] = [];
  const totalArea = bounds.width * bounds.height;

  const normalizedItems = items.map((it) => ({
    ...it,
    area: (it.size / totalSum) * totalArea
  }));

  let currentBounds = { ...bounds };
  let row: typeof normalizedItems = [];

  for (let i = 0; i < normalizedItems.length; i++) {
    const item = normalizedItems[i];
    const candidateRow = [...row, item];
    const side = Math.min(currentBounds.width, currentBounds.height);

    if (row.length === 0 || worst(row, side) >= worst(candidateRow, side)) {
      row = candidateRow;
    } else {
      currentBounds = layoutRow(row, currentBounds, results, totalSum, depth, colorIndex);
      row = [item];
    }
  }

  if (row.length > 0) {
    layoutRow(row, currentBounds, results, totalSum, depth, colorIndex);
  }

  return results;
}

function worst(row: Array<{ area: number }>, side: number): number {
  if (row.length === 0 || side <= 0) return Infinity;
  const s2 = side * side;
  let maxArea = -Infinity;
  let minArea = Infinity;
  let sumArea = 0;

  for (let i = 0; i < row.length; i++) {
    const a = row[i].area;
    sumArea += a;
    if (a > maxArea) maxArea = a;
    if (a < minArea) minArea = a;
  }

  if (sumArea <= 0 || minArea <= 0) return Infinity;
  const r2 = sumArea * sumArea;

  return Math.max((s2 * maxArea) / r2, r2 / (s2 * minArea));
}

function layoutRow(
  row: Array<ItemWithSize & { area: number }>,
  bounds: Bounds,
  results: TreemapRect[],
  totalSum: number,
  depth: number,
  colorIndex: number
): Bounds {
  if (row.length === 0) return bounds;

  const isHorizontal = bounds.width >= bounds.height;
  const sideLength = isHorizontal ? bounds.height : bounds.width;
  const rowArea = row.reduce((s, it) => s + it.area, 0);
  const rowThickness = sideLength > 0 ? rowArea / sideLength : 0;

  let pos = isHorizontal ? bounds.y : bounds.x;

  for (let idx = 0; idx < row.length; idx++) {
    const item = row[idx];
    const itemLength = rowThickness > 0 ? item.area / rowThickness : 0;
    const pct = totalSum > 0 ? item.size / totalSum : 0;
    const itemColorIdx = depth === 0 ? results.length : (colorIndex * 2 + idx) % 12;

    let rect: TreemapRect;

    if (isHorizontal) {
      rect = {
        id: item.isOther ? `other-${depth}-${bounds.x}-${pos}` : (item.node?.id || item.node?.path || Math.random().toString()),
        name: item.isOther ? `Other (${item.otherCount} items)` : (item.node?.name || 'Unnamed'),
        path: item.node?.path || '',
        type: item.isOther ? 'other' : (item.node?.type || 'file'),
        size: item.size,
        percentage: pct,
        depth,
        x: bounds.x,
        y: pos,
        width: rowThickness,
        height: itemLength,
        node: item.node,
        colorIndex: itemColorIdx
      };
      pos += itemLength;
    } else {
      rect = {
        id: item.isOther ? `other-${depth}-${pos}-${bounds.y}` : (item.node?.id || item.node?.path || Math.random().toString()),
        name: item.isOther ? `Other (${item.otherCount} items)` : (item.node?.name || 'Unnamed'),
        path: item.node?.path || '',
        type: item.isOther ? 'other' : (item.node?.type || 'file'),
        size: item.size,
        percentage: pct,
        depth,
        x: pos,
        y: bounds.y,
        width: itemLength,
        height: rowThickness,
        node: item.node,
        colorIndex: itemColorIdx
      };
      pos += itemLength;
    }

    results.push(rect);
  }

  // Return remaining bounds
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
