import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useStorageStore } from '../../stores/storageStore';
import { computeTreemap, TreemapRect } from '@shared/analyzer/treemap';
import { categorizeFile, CATEGORY_COLORS } from '@shared/analyzer/categorizer';
import { formatBytes } from '@shared/utils/formatters';
import { Layers } from 'lucide-react';
import './TreemapView.css';

// Distinct palette for folders and mixed content
const PALETTE = [
  '#0284c7', // Sky blue
  '#0d9488', // Teal
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#3b82f6', // Blue
  '#14b8a6', // Cyan
  '#84cc16'  // Lime
];

export const TreemapView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [hoveredRect, setHoveredRect] = useState<TreemapRect | null>(null);

  const {
    currentDirectory,
    selectedNode,
    drillDown,
    selectNode
  } = useStorageStore();

  // ResizeObserver to track container size accurately
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

  const rects = useMemo(() => {
    if (!currentDirectory || dimensions.width <= 0 || dimensions.height <= 0) {
      return [];
    }

    return computeTreemap(
      currentDirectory.children,
      currentDirectory.size,
      { x: 0, y: 0, width: dimensions.width, height: dimensions.height }
    );
  }, [currentDirectory, dimensions]);

  const getNodeColor = (rect: TreemapRect, index: number) => {
    if (rect.type === 'other') return '#475569';
    if (rect.type === 'file') {
      const cat = categorizeFile(rect.node?.extension || rect.name);
      return CATEGORY_COLORS[cat] || '#64748b';
    }
    return PALETTE[index % PALETTE.length];
  };

  const handleRectClick = (rect: TreemapRect) => {
    if (rect.node) {
      selectNode(rect.node);
      if (rect.node.type === 'directory') {
        drillDown(rect.node);
      }
    }
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
    <div className="treemap-container">
      {hoveredRect && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 10,
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid var(--border-focus)',
          borderRadius: '8px',
          padding: '8px 14px',
          fontSize: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <div style={{ fontWeight: 600, color: '#f8fafc' }}>{hoveredRect.name}</div>
          <div style={{ color: '#38bdf8' }}>
            {formatBytes(hoveredRect.size)} ({(hoveredRect.percentage * 100).toFixed(1)}%)
          </div>
        </div>
      )}

      <div className="treemap-canvas-wrapper" ref={containerRef}>
        {dimensions.width > 0 && dimensions.height > 0 && (
          <svg className="treemap-svg" width={dimensions.width} height={dimensions.height}>
            {rects.map((rect, index) => {
              const isSelected = selectedNode?.id === rect.id;
              const fill = getNodeColor(rect, index);
              const showText = rect.width >= 55 && rect.height >= 35;
              const showSize = rect.width >= 70 && rect.height >= 50;

              return (
                <g
                  key={rect.id || index}
                  className={`treemap-node ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleRectClick(rect)}
                  onMouseEnter={() => setHoveredRect(rect)}
                  onMouseLeave={() => setHoveredRect(null)}
                >
                  <rect
                    className="treemap-rect"
                    x={rect.x}
                    y={rect.y}
                    width={rect.width}
                    height={rect.height}
                    fill={fill}
                  />

                  {showText && (
                    <text
                      className="treemap-node-text"
                      x={rect.x + 8}
                      y={rect.y + 18}
                      clipPath={`inset(0px ${Math.max(0, rect.width - 16)}px 0px 0px)`}
                    >
                      <tspan className="treemap-node-title">
                        {rect.name.length > 20 && rect.width < 140
                          ? rect.name.substring(0, 16) + '...'
                          : rect.name}
                      </tspan>
                      {showSize && (
                        <tspan
                          className="treemap-node-size"
                          x={rect.x + 8}
                          y={rect.y + 34}
                        >
                          {formatBytes(rect.size)}
                        </tspan>
                      )}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
};
