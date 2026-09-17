import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useStorageStore } from '../../stores/storageStore';
import { computeHierarchicalTreemap, TreemapRect } from '@shared/analyzer/treemap';
import { categorizeFile, CATEGORY_COLORS } from '@shared/analyzer/categorizer';
import { formatBytes } from '@shared/utils/formatters';
import { Layers } from 'lucide-react';
import type { FileNode } from '@shared/models/fileNode';
import './TreemapView.css';

// Rich branch base tones for nested directory containers
const CONTAINER_PALETTE = [
  '#2a3b4c', // Steel Blue
  '#2b3f2e', // Forest Green
  '#4a3a2a', // Warm Amber / Brown
  '#3d2b4f', // Deep Violet
  '#1d3d44', // Dark Teal
  '#4a2634', // Deep Rose / Wine
  '#263238', // Slate Charcoal
  '#3e3526'  // Bronze
];

// Vibrant leaf tile colors matching reference screenshot
const LEAF_PALETTE = [
  '#f43f5e', // Rose / Red
  '#f97316', // Orange
  '#10b981', // Emerald / Dev Green
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#eab308'  // Amber
];

export const TreemapView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [hoveredNode, setHoveredNode] = useState<{ rect: TreemapRect; x: number; y: number } | null>(null);

  const {
    currentDirectory,
    selectedNode,
    drillDown,
    selectNode
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

  const hierarchicalRects = useMemo(() => {
    if (!currentDirectory || dimensions.width <= 0 || dimensions.height <= 0) {
      return [];
    }

    return computeHierarchicalTreemap(
      currentDirectory,
      { x: 0, y: 0, width: dimensions.width, height: dimensions.height },
      0,
      3
    );
  }, [currentDirectory, dimensions]);

  const getContainerBg = (rect: TreemapRect) => {
    const idx = (rect.colorIndex || 0) % CONTAINER_PALETTE.length;
    return CONTAINER_PALETTE[idx];
  };

  const getLeafColor = (rect: TreemapRect, index: number) => {
    if (rect.type === 'other') return '#334155';
    if (rect.node?.extension) {
      const cat = categorizeFile(rect.node.extension);
      return CATEGORY_COLORS[cat] || LEAF_PALETTE[index % LEAF_PALETTE.length];
    }
    return LEAF_PALETTE[index % LEAF_PALETTE.length];
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
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top
    });
  };

  // Recursive Renderer for Treemap Tiles
  const renderRect = (rect: TreemapRect, index: number): React.ReactNode => {
    const isSelected = selectedNode?.id === rect.id;
    const hasChildren = rect.children && rect.children.length > 0;

    if (rect.type === 'directory' && hasChildren) {
      const bg = getContainerBg(rect);
      const showHeader = rect.width >= 50 && rect.height >= 25;

      return (
        <g
          key={rect.id || index}
          className={`tree-dir-box ${isSelected ? 'selected' : ''}`}
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

          {showHeader && (
            <>
              <rect
                className="dir-header-bar"
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={18}
              />
              <text
                className="dir-header-text"
                x={rect.x + 6}
                y={rect.y + 13}
              >
                {rect.name.length > 18 && rect.width < 120
                  ? rect.name.substring(0, 14) + '..'
                  : rect.name}
              </text>
              {rect.width >= 100 && (
                <text
                  className="dir-header-size"
                  x={rect.x + rect.width - 6}
                  y={rect.y + 13}
                >
                  {formatBytes(rect.size, 1)}
                </text>
              )}
            </>
          )}

          {/* Render nested children */}
          {rect.children?.map((child, cIdx) => renderRect(child, cIdx))}
        </g>
      );
    }

    // Leaf tile (File or bottom-level directory)
    const leafFill = getLeafColor(rect, index);
    const showText = rect.width >= 40 && rect.height >= 25;
    const showSize = rect.width >= 60 && rect.height >= 40;

    return (
      <g
        key={rect.id || index}
        className={`tree-leaf-box ${isSelected ? 'selected' : ''}`}
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
          <text className="leaf-text" x={rect.x + 5} y={rect.y + 14}>
            {rect.name.length > 14 && rect.width < 90
              ? rect.name.substring(0, 11) + '..'
              : rect.name}
          </text>
        )}

        {showSize && (
          <text className="leaf-size" x={rect.x + 5} y={rect.y + 28}>
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

  return (
    <div
      className="treemap-container"
      ref={containerRef}
      onMouseLeave={() => setHoveredNode(null)}
    >
      {/* Floating Tooltip */}
      {hoveredNode && (
        <div
          className="treemap-floating-tooltip"
          style={{
            left: Math.min(dimensions.width - 160, Math.max(160, hoveredNode.x)),
            top: Math.max(80, hoveredNode.y)
          }}
        >
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
