import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useStorageStore } from '../../stores/storageStore';
import { computeHierarchicalTreemap, TreemapRect } from '@shared/analyzer/treemap';
import { categorizeFile, CATEGORY_COLORS } from '@shared/analyzer/categorizer';
import { isNodeHighlighted } from '@shared/analyzer/filterMatcher';
import { formatBytes } from '@shared/utils/formatters';
import { Layers } from 'lucide-react';
import type { FileNode } from '@shared/models/fileNode';
import './TreemapView.css';

// 12 Rich distinct branch container themes matching DissectMac
const BRANCH_CONTAINER_THEMES = [
  '#2a3b50', // Steel Slate Blue
  '#233f2e', // Forest Green
  '#433421', // Warm Terracotta Amber
  '#3a264e', // Plum Violet
  '#1a3a42', // Ocean Teal
  '#44262c', // Warm Coral / Wine
  '#314023', // Olive Moss
  '#282c52', // Deep Indigo
  '#482d1c', // Warm Copper
  '#442237', // Deep Rose
  '#1c4037', // Mint Sage
  '#263342'  // Graphite Blue
];

// Rich leaf accents for diverse, colorful tile rendering
const BRANCH_LEAF_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f43f5e', // Coral Rose
  '#84cc16', // Lime Green
  '#6366f1', // Indigo
  '#f97316', // Orange
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#0ea5e9'  // Sky
];

function adjustColorShade(hex: string, index: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((ch) => ch + ch).join('');
  }
  let r = parseInt(c.substring(0, 2), 16) || 0;
  let g = parseInt(c.substring(2, 4), 16) || 0;
  let b = parseInt(c.substring(4, 6), 16) || 0;

  const variations = [0, -14, 10, -22, 16, -8];
  const delta = variations[index % variations.length];

  r = Math.min(255, Math.max(0, Math.round(r + delta)));
  g = Math.min(255, Math.max(0, Math.round(g + delta)));
  b = Math.min(255, Math.max(0, Math.round(b + delta)));

  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function getTextColorForBg(hex: string): { text: string; subtext: string; textShadow?: string } {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((ch) => ch + ch).join('');
  }
  const r = parseInt(c.substring(0, 2), 16) || 0;
  const g = parseInt(c.substring(2, 4), 16) || 0;
  const b = parseInt(c.substring(4, 6), 16) || 0;

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  if (luminance > 0.52) {
    return {
      text: '#0f172a',
      subtext: 'rgba(15, 23, 42, 0.75)',
      textShadow: 'none'
    };
  } else {
    return {
      text: '#ffffff',
      subtext: 'rgba(255, 255, 255, 0.8)',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)'
    };
  }
}

interface TreemapViewProps {
  onContextMenu?: (e: React.MouseEvent, node: FileNode) => void;
}

export const TreemapView: React.FC<TreemapViewProps> = ({ onContextMenu }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [hoveredNode, setHoveredNode] = useState<{ rect: TreemapRect; x: number; y: number } | null>(null);

  const {
    currentDirectory,
    selectedNode,
    drillDown,
    selectNode,
    devFilters,
    searchQuery
  } = useStorageStore();

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: Math.floor(entry.contentRect.width),
          height: Math.floor(entry.contentRect.height)
        });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute hierarchical treemap
  const hierarchicalRects = useMemo(() => {
    if (!currentDirectory || dimensions.width <= 0 || dimensions.height <= 0) {
      return [];
    }

    // If current directory has only 1 child directory (e.g. Users -> username), unwrap it for full-screen density
    let rootToRender = currentDirectory;
    if (
      rootToRender.children &&
      rootToRender.children.length === 1 &&
      rootToRender.children[0].type === 'directory' &&
      rootToRender.children[0].children &&
      rootToRender.children[0].children.length > 0
    ) {
      rootToRender = rootToRender.children[0];
    }

    return computeHierarchicalTreemap(
      rootToRender,
      { x: 0, y: 0, width: dimensions.width, height: dimensions.height },
      0,
      4
    );
  }, [currentDirectory, dimensions]);

  // Only activate spotlight dimming when at least one item matches in the visible tree
  const hasMatchingItems = useMemo(() => {
    const isFilterOn = Object.values(devFilters).some(Boolean) || searchQuery.trim().length > 0;
    if (!isFilterOn || hierarchicalRects.length === 0) return false;

    function checkMatch(rect: TreemapRect): boolean {
      if (isNodeHighlighted(rect.node, devFilters, searchQuery)) return true;
      if (rect.children) {
        for (const child of rect.children) {
          if (checkMatch(child)) return true;
        }
      }
      return false;
    }

    return hierarchicalRects.some(checkMatch);
  }, [devFilters, searchQuery, hierarchicalRects]);

  const getContainerBg = (rect: TreemapRect) => {
    const idx = (rect.colorIndex || 0) % BRANCH_CONTAINER_THEMES.length;
    return BRANCH_CONTAINER_THEMES[idx];
  };

  const getLeafColor = (rect: TreemapRect, index: number) => {
    if (rect.type === 'other') return '#374151';

    if (rect.node?.extension) {
      const cat = categorizeFile(rect.node.extension);
      if (cat !== 'other') {
        const baseColor = CATEGORY_COLORS[cat];
        return adjustColorShade(baseColor, index);
      }
    }

    // Assign rich colorful tone based on branch and index
    const colorIdx = (rect.colorIndex + index) % BRANCH_LEAF_COLORS.length;
    return adjustColorShade(BRANCH_LEAF_COLORS[colorIdx], index);
  };

  const handleNodeClick = (e: React.MouseEvent, node?: FileNode) => {
    e.stopPropagation();
    if (node) {
      selectNode(node);
      if (node.type === 'directory') {
        drillDown(node);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node?: FileNode) => {
    if (!node) return;
    e.preventDefault();
    e.stopPropagation();
    selectNode(node);
    if (onContextMenu) {
      onContextMenu(e, node);
    }
  };

  const handleMouseMove = (e: React.MouseEvent, rect: TreemapRect) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const bounds = containerRef.current.getBoundingClientRect();
    setHoveredNode({
      rect,
      x: Math.round(e.clientX - bounds.left),
      y: Math.round(e.clientY - bounds.top)
    });
  };

  // Render stacked directory header bars (e.g. .ollama > models > blobs)
  const renderHeaders = (rect: TreemapRect) => {
    const headers = rect.collapsedHeaders || [rect.name];
    const headerH = 20;

    return headers.map((headerName, hIdx) => {
      const hY = rect.y + hIdx * (headerH + 1);
      const isTop = hIdx === 0;

      return (
        <React.Fragment key={`${rect.id}-h-${hIdx}`}>
          <rect
            className="dir-header-bar"
            x={rect.x}
            y={hY}
            width={rect.width}
            height={headerH}
          />
          <text
            className="dir-header-text"
            x={rect.x + 6}
            y={hY + 14}
          >
            {headerName.length > 22 && rect.width < 140
              ? headerName.substring(0, 18) + '..'
              : headerName}
          </text>
          {isTop && rect.width >= 90 && (
            <text
              className="dir-header-size"
              x={rect.x + rect.width - 6}
              y={hY + 14}
            >
              {formatBytes(rect.size, 1)}
            </text>
          )}
        </React.Fragment>
      );
    });
  };

  // Recursive Renderer for Treemap Tiles
  const renderRect = (rect: TreemapRect, index: number): React.ReactNode => {
    const isSelected = selectedNode?.id === rect.id;
    const hasChildren = rect.children && rect.children.length > 0;
    const isMatched = isNodeHighlighted(rect.node, devFilters, searchQuery);

    let filterClass = '';
    if (hasMatchingItems) {
      filterClass = isMatched ? 'highlighted' : 'dimmed';
    }

    // Directory container
    if (rect.type === 'directory') {
      const bg = getContainerBg(rect);
      const showHeader = rect.width >= 45 && rect.height >= 25;

      return (
        <g
          key={rect.id || index}
          className={`tree-dir-box ${filterClass} ${isSelected ? 'selected' : ''}`}
          onClick={(e) => handleNodeClick(e, rect.node)}
          onContextMenu={(e) => handleContextMenu(e, rect.node)}
          onMouseMove={(e) => handleMouseMove(e, rect)}
        >
          <rect
            className="dir-bg"
            x={rect.x}
            y={rect.y}
            width={rect.width}
            height={rect.height}
            fill={bg}
          />

          {showHeader && renderHeaders(rect)}

          {/* Render nested children if present */}
          {hasChildren && rect.children?.map((child, cIdx) => renderRect(child, cIdx))}
        </g>
      );
    }

    // Leaf file tile
    const leafFill = getLeafColor(rect, index);
    const theme = getTextColorForBg(leafFill);
    const showText = rect.width >= 35 && rect.height >= 20;
    const showSize = rect.width >= 55 && rect.height >= 35;

    return (
      <g
        key={rect.id || index}
        className={`tree-leaf-box ${filterClass} ${isSelected ? 'selected' : ''}`}
        onClick={(e) => handleNodeClick(e, rect.node)}
        onContextMenu={(e) => handleContextMenu(e, rect.node)}
        onMouseMove={(e) => handleMouseMove(e, rect)}
      >
        <rect
          className="leaf-rect"
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          fill={leafFill}
        />

        {showText && (
          <text
            className="leaf-text"
            x={rect.x + 5}
            y={rect.y + 13}
            fill={theme.text}
            style={{ textShadow: theme.textShadow }}
          >
            {rect.name.length > 14 && rect.width < 90
              ? rect.name.substring(0, 11) + '..'
              : rect.name}
          </text>
        )}

        {showSize && (
          <text
            className="leaf-size"
            x={rect.x + 5}
            y={rect.y + 26}
            fill={theme.subtext}
            style={{ textShadow: theme.textShadow }}
          >
            {formatBytes(rect.size, 1)}
          </text>
        )}
      </g>
    );
  };

  if (!currentDirectory || !currentDirectory.children || currentDirectory.children.length === 0) {
    return (
      <div className="treemap-container">
        <div className="treemap-empty-state">
          <Layers size={36} style={{ opacity: 0.4 }} />
          <span>This folder is empty or contains 0 bytes.</span>
        </div>
      </div>
    );
  }

  // Calculate sharp, pixel-aligned tooltip placement (below-right of cursor)
  const getTooltipStyle = () => {
    if (!hoveredNode) return {};
    const tooltipW = 280;
    const tooltipH = 85;
    const offset = 16;
    const padding = 12;

    // Default: Below and to the right of cursor
    let left = hoveredNode.x + offset;
    let top = hoveredNode.y + offset;

    // Flip to left if overflowing right edge
    if (left + tooltipW > dimensions.width - padding) {
      left = Math.max(padding, hoveredNode.x - tooltipW - offset);
    }

    // Flip to above if overflowing bottom edge
    if (top + tooltipH > dimensions.height - padding) {
      top = Math.max(padding, hoveredNode.y - tooltipH - offset);
    }

    return {
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`
    };
  };

  return (
    <div
      className="treemap-container"
      ref={containerRef}
      onMouseLeave={() => setHoveredNode(null)}
    >
      {/* Crystal-Clear Floating Tooltip */}
      {hoveredNode && (
        <div className="treemap-floating-tooltip" style={getTooltipStyle()}>
          <div className="tooltip-name">{hoveredNode.rect.name}</div>
          <div className="tooltip-size">{formatBytes(hoveredNode.rect.size)}</div>
          <div className="tooltip-path">{hoveredNode.rect.path || hoveredNode.rect.name}</div>
        </div>
      )}

      <div className="treemap-canvas-wrapper">
        {dimensions.width > 0 && dimensions.height > 0 && hierarchicalRects.length > 0 ? (
          <svg className="treemap-svg" width={dimensions.width} height={dimensions.height}>
            {hierarchicalRects.map((rect, idx) => renderRect(rect, idx))}
          </svg>
        ) : (
          <div className="treemap-loader-container">
            <div className="treemap-loader-spinner" />
            <span className="treemap-loader-text">Rendering Interactive Treemap...</span>
          </div>
        )}
      </div>
    </div>
  );
};
