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
  colorIndex?: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutItem {
  node?: FileNode;
  size: number;
  area: number;
  isOther?: boolean;
  otherCount?: number;
}

/**
 * Computes a multi-level hierarchical nested squarified treemap.
 */
export function computeHierarchicalTreemap(
  node: FileNode | undefined,
  bounds: Bounds,
  depth: number = 0,
  maxDepth: number = 3,
  colorIndex: number = 0
): TreemapRect[] {
  if (!node || !node.children || node.children.length === 0 || bounds.width <= 4 || bounds.height <= 4) {
    return [];
  }

  // Filter valid positive-size children and sort descending
  const validChildren = node.children
    .filter((c) => c.size > 0)
    .sort((a, b) => b.size - a.size);

  if (validChildren.length === 0) return [];

  const totalSum = validChildren.reduce((acc, c) => acc + c.size, 0);
  if (totalSum <= 0) return [];

  // Group very small items to avoid clutter
  const minPercentage = depth === 0 ? 0.003 : (depth === 1 ? 0.008 : 0.015);
  const maxItems = depth === 0 ? 25 : 15;

  const mainItems: FileNode[] = [];
  const otherItems: FileNode[] = [];

  for (let i = 0; i < validChildren.length; i++) {
    const child = validChildren[i];
    const pct = child.size / totalSum;
    if (i < maxItems && pct >= minPercentage) {
      mainItems.push(child);
    } else {
      otherItems.push(child);
    }
  }

  const layoutNodes: LayoutItem[] = mainItems.map((n) => ({
    node: n,
    size: n.size,
    area: 0
  }));

  if (otherItems.length > 0) {
    const otherSize = otherItems.reduce((acc, it) => acc + it.size, 0);
    if (otherSize > 0) {
      layoutNodes.push({
        size: otherSize,
        area: 0,
        isOther: true,
        otherCount: otherItems.length
      });
    }
  }

  const totalArea = bounds.width * bounds.height;
  const layoutSum = layoutNodes.reduce((acc, item) => acc + item.size, 0);
  if (layoutSum <= 0) return [];

  for (const item of layoutNodes) {
    item.area = (item.size / layoutSum) * totalArea;
  }

  const flatTiles: TreemapRect[] = [];
  squarifyLayout(layoutNodes, [], { ...bounds }, flatTiles, totalSum, depth, colorIndex);

  // For each tile, if it's a directory with sufficient area and depth < maxDepth, recursively compute its children
  for (let i = 0; i < flatTiles.length; i++) {
    const tile = flatTiles[i];
    if (
      tile.type === 'directory' &&
      tile.node &&
      tile.node.children &&
      tile.node.children.length > 0 &&
      depth < maxDepth &&
      tile.width >= 70 &&
      tile.height >= 55
    ) {
      const headerHeight = 19;
      const padding = 3;
      const innerBounds: Bounds = {
        x: tile.x + padding,
        y: tile.y + headerHeight + 1,
        width: Math.max(0, tile.width - padding * 2),
        height: Math.max(0, tile.height - headerHeight - padding - 1)
      };

      tile.children = computeHierarchicalTreemap(
        tile.node,
        innerBounds,
        depth + 1,
        maxDepth,
        depth === 0 ? i : colorIndex
      );
    }
  }

  return flatTiles;
}

/**
 * Standard 2D Squarify Layout Algorithm
 */
function squarifyLayout(
  children: LayoutItem[],
  row: LayoutItem[],
  bounds: Bounds,
  results: TreemapRect[],
  totalSum: number,
  depth: number,
  colorIndex: number
): void {
  if (bounds.width <= 0 || bounds.height <= 0) return;

  if (children.length === 0) {
    if (row.length > 0) {
      layoutRow(row, bounds, results, totalSum, depth, colorIndex);
    }
    return;
  }

  const c = children[0];
  if (row.length === 0) {
    squarifyLayout(children.slice(1), [c], bounds, results, totalSum, depth, colorIndex);
    return;
  }

  const sideLength = Math.min(bounds.width, bounds.height);
  if (worstAspectRatio(row, sideLength) <= worstAspectRatio([...row, c], sideLength)) {
    // Adding c improves or preserves aspect ratio
    squarifyLayout(children.slice(1), [...row, c], bounds, results, totalSum, depth, colorIndex);
  } else {
    // Current row is optimal; layout current row and start new row in remaining bounds
    const remainingBounds = layoutRow(row, bounds, results, totalSum, depth, colorIndex);
    squarifyLayout(children, [], remainingBounds, results, totalSum, depth, colorIndex);
  }
}

function worstAspectRatio(row: LayoutItem[], sideLength: number): number {
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
  row: LayoutItem[],
  bounds: Bounds,
  results: TreemapRect[],
  totalSum: number,
  depth: number,
  colorIndex: number
): Bounds {
  if (row.length === 0) return bounds;

  const isWidthLonger = bounds.width >= bounds.height;
  const rowArea = row.reduce((s, it) => s + it.area, 0);
  const sideLength = isWidthLonger ? bounds.height : bounds.width;

  const rowThickness = sideLength > 0 ? rowArea / sideLength : 0;

  let currentPos = isWidthLonger ? bounds.y : bounds.x;

  for (let idx = 0; idx < row.length; idx++) {
    const item = row[idx];
    const itemLength = rowThickness > 0 ? item.area / rowThickness : 0;
    const pct = totalSum > 0 ? item.size / totalSum : 0;

    let rect: TreemapRect;

    if (isWidthLonger) {
      // Row is vertical slice of width = rowThickness, items stacked vertically
      rect = {
        id: item.isOther ? `other-${depth}-${currentPos}` : (item.node?.id || item.node?.path || Math.random().toString()),
        name: item.isOther ? `Other (${item.otherCount} items)` : (item.node?.name || 'Unnamed'),
        path: item.node?.path || '',
        type: item.isOther ? 'other' : (item.node?.type || 'file'),
        size: item.size,
        percentage: pct,
        depth,
        x: bounds.x,
        y: currentPos,
        width: rowThickness,
        height: itemLength,
        node: item.node,
        colorIndex: depth === 0 ? results.length : colorIndex
      };
      currentPos += itemLength;
    } else {
      // Row is horizontal slice of height = rowThickness, items placed side-by-side horizontally
      rect = {
        id: item.isOther ? `other-${depth}-${currentPos}` : (item.node?.id || item.node?.path || Math.random().toString()),
        name: item.isOther ? `Other (${item.otherCount} items)` : (item.node?.name || 'Unnamed'),
        path: item.node?.path || '',
        type: item.isOther ? 'other' : (item.node?.type || 'file'),
        size: item.size,
        percentage: pct,
        depth,
        x: currentPos,
        y: bounds.y,
        width: itemLength,
        height: rowThickness,
        node: item.node,
        colorIndex: depth === 0 ? results.length : colorIndex
      };
      currentPos += itemLength;
    }

    results.push(rect);
  }

  // Calculate remaining bounding box
  if (isWidthLonger) {
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
