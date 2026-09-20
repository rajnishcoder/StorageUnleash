import type { FileNode } from '../models/fileNode';

export interface SunburstArc {
  id: string;
  node: FileNode;
  depth: number;
  startAngle: number; // in radians, 0 to 2*PI
  endAngle: number;   // in radians
  innerRadius: number;
  outerRadius: number;
  color: string;
  pathString: string;
}

export interface SunburstLayout {
  arcs: SunburstArc[];
  centerX: number;
  centerY: number;
  centerRadius: number;
  maxRadius: number;
}

// Vibrant reference color palette distributed across root child branches
export const SUNBURST_PALETTE = [
  '#a855f7', // Purple / Violet
  '#ec4899', // Pink / Magenta
  '#f43f5e', // Rose / Ruby
  '#f97316', // Orange / Terracotta
  '#eab308', // Amber / Gold
  '#84cc16', // Lime
  '#10b981', // Emerald / Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#d946ef', // Fuchsia
  '#14b8a6'  // Teal
];

/**
 * Converts polar coordinates (radius, angle in radians) to Cartesian coordinates (x, y).
 * Offset angle by -PI/2 so 0 radians starts at 12 o'clock.
 */
export function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInRadians: number
): { x: number; y: number } {
  const adjustedAngle = angleInRadians - Math.PI / 2;
  return {
    x: centerX + radius * Math.cos(adjustedAngle),
    y: centerY + radius * Math.sin(adjustedAngle)
  };
}

/**
 * Generates an SVG path string for a donut / annular arc segment.
 */
export function describeArc(
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  // Clamp angle delta to slightly less than 2*PI to avoid SVG zero-length arc collapse
  let angleDelta = endAngle - startAngle;
  if (angleDelta >= 2 * Math.PI) {
    angleDelta = 2 * Math.PI - 0.0001;
    endAngle = startAngle + angleDelta;
  }

  const p1 = polarToCartesian(centerX, centerY, outerRadius, startAngle);
  const p2 = polarToCartesian(centerX, centerY, outerRadius, endAngle);
  const p3 = polarToCartesian(centerX, centerY, innerRadius, endAngle);
  const p4 = polarToCartesian(centerX, centerY, innerRadius, startAngle);

  const largeArcFlag = angleDelta > Math.PI ? 1 : 0;

  if (innerRadius <= 0) {
    // Pie slice from center
    return `M ${centerX} ${centerY} L ${p1.x} ${p1.y} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y} Z`;
  }

  return [
    `M ${p1.x} ${p1.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${p4.x} ${p4.y}`,
    'Z'
  ].join(' ');
}

/**
 * Adjusts color shade (lightness/saturation) for child slices based on depth.
 */
export function modulateShade(baseHex: string, depthDelta: number, indexDelta: number): string {
  // Simple hex brightness tweak
  const hex = baseHex.replace('#', '');
  let r = parseInt(hex.substring(0, 2), 16) || 100;
  let g = parseInt(hex.substring(2, 4), 16) || 100;
  let b = parseInt(hex.substring(4, 6), 16) || 100;

  const factor = 1 + (depthDelta * 0.12) + (indexDelta % 3 === 0 ? 0.05 : -0.05);
  r = Math.min(255, Math.max(0, Math.round(r * factor)));
  g = Math.min(255, Math.max(0, Math.round(g * factor)));
  b = Math.min(255, Math.max(0, Math.round(b * factor)));

  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Recursively computes the Sunburst layout for a FileNode tree.
 */
export function computeSunburstLayout(
  root: FileNode | null,
  width: number,
  height: number,
  maxDepth = 3,
  minAngleDeg = 0.4
): SunburstLayout {
  const minDim = Math.min(width, height);
  const centerX = width / 2;
  const centerY = height / 2;
  const centerRadius = Math.max(36, Math.min(70, minDim * 0.16));
  const maxRadius = Math.max(centerRadius + 40, (minDim / 2) - 16);
  const ringThickness = (maxRadius - centerRadius) / maxDepth;

  const arcs: SunburstArc[] = [];

  if (!root || !root.children || root.children.length === 0 || root.size === 0) {
    return { arcs, centerX, centerY, centerRadius, maxRadius };
  }

  const minAngleRad = (minAngleDeg * Math.PI) / 180;
  const totalRootSize = root.children.reduce((acc, c) => acc + c.size, 0) || root.size;

  // Process Level 1 direct children
  const sortedChildren = [...root.children]
    .filter((c) => c.size > 0)
    .sort((a, b) => b.size - a.size);

  let currentStartAngle = 0;

  sortedChildren.forEach((child, index) => {
    const angleSpan = (child.size / totalRootSize) * 2 * Math.PI;
    const endAngle = currentStartAngle + angleSpan;
    const baseColor = SUNBURST_PALETTE[index % SUNBURST_PALETTE.length];

    traverseNode(
      child,
      1,
      currentStartAngle,
      endAngle,
      baseColor,
      0
    );

    currentStartAngle = endAngle;
  });

  function traverseNode(
    node: FileNode,
    depth: number,
    startAngle: number,
    endAngle: number,
    branchColor: string,
    siblingIndex: number
  ) {
    if (depth > maxDepth) return;
    if (endAngle - startAngle < minAngleRad) return;

    const innerR = centerRadius + (depth - 1) * ringThickness + 2;
    const outerR = centerRadius + depth * ringThickness;

    const nodeColor = depth === 1 ? branchColor : modulateShade(branchColor, depth - 1, siblingIndex);
    const pathString = describeArc(centerX, centerY, innerR, outerR, startAngle, endAngle);

    arcs.push({
      id: `${node.id || node.path}-${depth}`,
      node,
      depth,
      startAngle,
      endAngle,
      innerRadius: innerR,
      outerRadius: outerR,
      color: nodeColor,
      pathString
    });

    if (node.children && node.children.length > 0 && depth < maxDepth) {
      const nodeChildren = [...node.children]
        .filter((c) => c.size > 0)
        .sort((a, b) => b.size - a.size);

      const totalSubSize = nodeChildren.reduce((acc, c) => acc + c.size, 0) || node.size;
      let childStartAngle = startAngle;
      const totalParentAngle = endAngle - startAngle;

      nodeChildren.forEach((subChild, subIdx) => {
        const subAngleSpan = (subChild.size / totalSubSize) * totalParentAngle;
        const subEndAngle = childStartAngle + subAngleSpan;

        traverseNode(
          subChild,
          depth + 1,
          childStartAngle,
          subEndAngle,
          branchColor,
          subIdx
        );

        childStartAngle = subEndAngle;
      });
    }
  }

  return {
    arcs,
    centerX,
    centerY,
    centerRadius,
    maxRadius
  };
}
