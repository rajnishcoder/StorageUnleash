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

export const TreemapView: React.FC = () => {
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

  const hasActiveFilter = useMemo(() => {
    return Object.values(devFilters).some(Boolean) || searchQuery.trim().length > 0;
  }, [devFilters, searchQuery]);

  // Compute hierarchical treemap
  const hierarchicalRects = useMemo(() => {
    if (!currentDirectory || dimensions.width <= 0 || dimensions.height <= 0) {
      return [];
    }

    // If current directory has only 1 child directory (e.g. Users -> rajnishkumar), unwrap it for full-screen density
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

  const getContainerBg = (rect: TreemapRect) => {
    const idx = (rect.colorIndex || 0) % BRANCH_CONTAINER_THEMES.length;
    return BRANCH_CONTAINER_THEMES[idx];
  };

  const getLeafColor = (rect: TreemapRect, index: number) => {
    if (rect.type === 'other') return '#374151';

    if (rect.node?.extension) {
      const cat = categorizeFile(rect.node.extension);
      if (cat !== 'other') {
        return CATEGORY_COLORS[cat];
      }
    }

    // Assign rich colorful tone based on branch and index
    const colorIdx = (rect.colorIndex + index) % BRANCH_LEAF_COLORS.length;
    return BRANCH_LEAF_COLORS[colorIdx];
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
    if (hasActiveFilter) {
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
    const showText = rect.width >= 35 && rect.height >= 20;
    const showSize = rect.width >= 55 && rect.height >= 35;

    return (
      <g
        key={rect.id || index}
        className={`tree-leaf-box ${filterClass} ${isSelected ? 'selected' : ''}`}
        onClick={(e) => handleNodeClick(e, rect.node)}
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
          <text className="leaf-text" x={rect.x + 5} y={rect.y + 13}>
            {rect.name.length > 14 && rect.width < 90
              ? rect.name.substring(0, 11) + '..'
              : rect.name}
          </text>
        )}

        {showSize && (
          <text className="leaf-size" x={rect.x + 5} y={rect.y + 26}>
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

  // Calculate sharp, pixel-aligned tooltip placement
  const getTooltipStyle = () => {
    if (!hoveredNode) return {};
    const tooltipW = 280;
    const tooltipH = 80;

    const left = Math.round(
      Math.min(dimensions.width - tooltipW - 12, Math.max(12, hoveredNode.x - tooltipW / 2))
    );

    const top =
      hoveredNode.y > tooltipH + 20
        ? Math.round(hoveredNode.y - tooltipH - 12)
        : Math.round(hoveredNode.y + 18);

    return {
      left: `${left}px`,
      top: `${top}px`
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
        {dimensions.width > 0 && dimensions.height > 0 && (
          <svg className="treemap-svg" width={dimensions.width} height={dimensions.height}>
            {hierarchicalRects.map((rect, idx) => renderRect(rect, idx))}
          </svg>
        )}
      </div>
    </div>
  );
};
