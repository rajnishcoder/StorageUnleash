import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  Folder,
  File,
  ChevronRight,
  Info,
  Check,
  Disc,
  Layers,
  Settings
} from 'lucide-react';
import { useStorageStore } from '../../stores/storageStore';
import { computeSunburstLayout, SunburstArc, SUNBURST_PALETTE } from '@shared/analyzer/sunburst';
import { formatBytes } from '@shared/utils/formatters';
import { categorizeFile, CATEGORY_COLORS } from '@shared/analyzer/categorizer';
import type { FileNode } from '@shared/models/fileNode';
import './SunburstView.css';

interface SunburstViewProps {
  onContextMenu?: (e: React.MouseEvent, node: FileNode) => void;
  onOpenCleanupModal?: () => void;
}

export const SunburstView: React.FC<SunburstViewProps> = ({
  onContextMenu,
  onOpenCleanupModal
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartDimensions, setChartDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0
  });

  const [inspectedFolder, setInspectedFolder] = useState<FileNode | null>(null);
  const [hoveredArc, setHoveredArc] = useState<{ arc: SunburstArc; x: number; y: number } | null>(
    null
  );

  const {
    currentDirectory,
    breadcrumbs,
    drillDown,
    drillUp,
    selectNode,
    selectedNode,
    cleanupList,
    toggleCleanupItem,
    platform
  } = useStorageStore();

  // ResizeObserver for Sunburst SVG chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setChartDimensions({
            width: Math.round(width),
            height: Math.round(height)
          });
        }
      }
    });

    observer.observe(chartContainerRef.current);
    return () => observer.disconnect();
  }, []);

  // Sorted direct children of current directory
  const rootChildren = useMemo(() => {
    if (!currentDirectory || !currentDirectory.children) return [];
    return [...currentDirectory.children]
      .filter((c) => c.size > 0)
      .sort((a, b) => b.size - a.size);
  }, [currentDirectory]);

  // Keep inspectedFolder in sync when directory changes
  useEffect(() => {
    if (rootChildren.length > 0) {
      // Pick first folder child, or first child
      const firstDir = rootChildren.find((c) => c.type === 'directory') || rootChildren[0];
      setInspectedFolder(firstDir || null);
    } else {
      setInspectedFolder(null);
    }
  }, [currentDirectory, rootChildren]);

  // Contents of the currently inspected folder
  const inspectedChildren = useMemo(() => {
    if (!inspectedFolder || !inspectedFolder.children) return [];
    return [...inspectedFolder.children]
      .filter((c) => c.size > 0)
      .sort((a, b) => b.size - a.size);
  }, [inspectedFolder]);

  // Compute Sunburst layout
  const sunburstLayout = useMemo(() => {
    if (chartDimensions.width === 0 || chartDimensions.height === 0 || !currentDirectory) {
      return null;
    }
    return computeSunburstLayout(
      currentDirectory,
      chartDimensions.width,
      chartDimensions.height,
      3,
      0.35
    );
  }, [currentDirectory, chartDimensions]);

  // Total cleanup statistics
  const totalCleanupBytes = useMemo(() => {
    return cleanupList.reduce((acc, it) => acc + it.size, 0);
  }, [cleanupList]);

  if (!currentDirectory || !currentDirectory.children || currentDirectory.children.length === 0) {
    const isMac = platform === 'darwin';
    return (
      <div className="sunburst-view-container">
        <div className="sunburst-empty-state">
          <Disc size={40} style={{ opacity: 0.4 }} />
          <span>This folder is empty or contains 0 bytes.</span>
          {isMac && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12.5px', color: '#94a3b8', maxWidth: '380px', lineHeight: 1.4 }}>
                If this folder contains files, macOS Privacy & Security may be restricting access.
              </span>
              <button
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: '#fbbf24',
                  fontSize: '12px',
                  fontWeight: 600,
                  padding: '7px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                onClick={() => window.storageAPI?.openSystemPrivacySettings?.()}
              >
                <Settings size={13} />
                <span>Open Privacy Settings</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Floating Tooltip coordinates
  const getTooltipStyle = () => {
    if (!hoveredArc) return {};
    const tooltipW = 260;
    const tooltipH = 80;
    const offset = 16;
    const padding = 12;

    let left = hoveredArc.x + offset;
    let top = hoveredArc.y + offset;

    if (left + tooltipW > chartDimensions.width - padding) {
      left = Math.max(padding, hoveredArc.x - tooltipW - offset);
    }
    if (top + tooltipH > chartDimensions.height - padding) {
      top = Math.max(padding, hoveredArc.y - tooltipH - offset);
    }

    return {
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`
    };
  };

  const isArcSelected = (arc: SunburstArc) => {
    if (hoveredArc?.arc.id === arc.id) return true;
    if (selectedNode && selectedNode.path === arc.node.path) return true;
    if (inspectedFolder && (inspectedFolder.path === arc.node.path || arc.node.path?.startsWith(inspectedFolder.path + '/'))) {
      return arc.depth === 1 && inspectedFolder.path === arc.node.path;
    }
    return false;
  };

  return (
    <div className="sunburst-view-container">
      <div className="sunburst-main-split">
        {/* Left Explorer: Dual Column List */}
        <div className="sunburst-explorer-columns">
          {/* Column 1: Folders Outline */}
          <div className="sunburst-col col-outline">
            <div className="sunburst-col-header">
              <span className="col-header-title">Folders Outline</span>
              <span className="col-header-count">{rootChildren.length} items</span>
            </div>

            <div className="sunburst-col-list">
              {rootChildren.map((item, idx) => {
                const isInspected = inspectedFolder?.path === item.path;
                const isHovered = hoveredArc?.arc.node.path === item.path;
                const branchColor = SUNBURST_PALETTE[idx % SUNBURST_PALETTE.length];

                return (
                  <div
                    key={item.id || item.path}
                    className={`sunburst-row outline-row ${isInspected ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
                    onClick={() => {
                      setInspectedFolder(item);
                      selectNode(item);
                    }}
                    onDoubleClick={() => {
                      if (item.type === 'directory') drillDown(item);
                    }}
                    onContextMenu={(e) => onContextMenu && onContextMenu(e, item)}
                    title={item.path}
                  >
                    <button
                      type="button"
                      className="btn-info-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectNode(item);
                      }}
                      title="Inspect details"
                    >
                      <Info size={13} />
                    </button>

                    <div className="row-icon-wrap" style={{ color: branchColor }}>
                      {item.type === 'directory' ? <Folder size={15} /> : <File size={15} />}
                    </div>

                    <span className="row-name">{item.name}</span>

                    <span className="row-size" style={{ color: branchColor }}>
                      {formatBytes(item.size, 1)}
                    </span>

                    {item.type === 'directory' && (
                      <ChevronRight size={14} className="row-chevron" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Folder Contents / Files */}
          <div className="sunburst-col col-contents">
            <div className="sunburst-col-header">
              <span className="col-header-title">
                {inspectedFolder ? inspectedFolder.name : 'Folder Contents'}
              </span>
              <span className="col-header-count">
                {inspectedChildren.length} {inspectedChildren.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="sunburst-col-list">
              {inspectedChildren.length > 0 ? (
                inspectedChildren.map((child) => {
                  const isChecked = cleanupList.some((it) => it.path === child.path);
                  const isSelected = selectedNode?.path === child.path;
                  const isHovered = hoveredArc?.arc.node.path === child.path;
                  const fileCat = categorizeFile(child.extension || child.name);
                  const catColor = CATEGORY_COLORS[fileCat] || '#94a3b8';

                  return (
                    <div
                      key={child.id || child.path}
                      className={`sunburst-row content-row ${isSelected ? 'active' : ''} ${isHovered ? 'hovered' : ''}`}
                      onClick={() => selectNode(child)}
                      onDoubleClick={() => {
                        if (child.type === 'directory') drillDown(child);
                      }}
                      onContextMenu={(e) => onContextMenu && onContextMenu(e, child)}
                      title={child.path}
                    >
                      {/* Checkbox for Batch Cleanup */}
                      <div
                        className={`row-checkbox ${isChecked ? 'checked' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCleanupItem(child);
                        }}
                        title={isChecked ? 'Remove from cleanup list' : 'Add to cleanup list'}
                      >
                        {isChecked && <Check size={11} color="#ffffff" />}
                      </div>

                      <div className="row-icon-wrap" style={{ color: catColor }}>
                        {child.type === 'directory' ? <Folder size={15} /> : <File size={15} />}
                      </div>

                      <span className="row-name">{child.name}</span>

                      <span className="row-size-badge">{formatBytes(child.size, 1)}</span>

                      {child.type === 'directory' && (
                        <ChevronRight size={14} className="row-chevron" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-empty-hint">
                  {inspectedFolder ? 'Folder is empty or contains only sub-zero files.' : 'Select a folder on the left to inspect contents.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Radial Chart Panel */}
        <div className="sunburst-chart-panel" ref={chartContainerRef}>
          {sunburstLayout && chartDimensions.width > 0 && chartDimensions.height > 0 ? (
            <svg
              className="sunburst-svg"
              width={chartDimensions.width}
              height={chartDimensions.height}
              onMouseLeave={() => setHoveredArc(null)}
            >
              {/* Radial Arc Rings */}
              <g className="sunburst-arcs-group">
                {sunburstLayout.arcs.map((arc) => {
                  const active = isArcSelected(arc);

                  return (
                    <path
                      key={arc.id}
                      d={arc.pathString}
                      fill={arc.color}
                      className={`sunburst-arc ${active ? 'active-arc' : ''}`}
                      onClick={() => {
                        if (arc.node.type === 'directory') {
                          drillDown(arc.node);
                        } else {
                          selectNode(arc.node);
                        }
                      }}
                      onContextMenu={(e) => onContextMenu && onContextMenu(e, arc.node)}
                      onMouseMove={(e) => {
                        const rect = chartContainerRef.current?.getBoundingClientRect();
                        if (rect) {
                          setHoveredArc({
                            arc,
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top
                          });
                        }
                      }}
                    />
                  );
                })}
              </g>

              {/* Center Circle (Current Root) */}
              <g
                className="sunburst-center-group"
                onClick={() => {
                  if (breadcrumbs.length > 1) {
                    drillUp(breadcrumbs.length - 2);
                  }
                }}
                style={{ cursor: breadcrumbs.length > 1 ? 'pointer' : 'default' }}
              >
                <circle
                  cx={sunburstLayout.centerX}
                  cy={sunburstLayout.centerY}
                  r={sunburstLayout.centerRadius}
                  className="sunburst-center-circle"
                />
                <text
                  x={sunburstLayout.centerX}
                  y={sunburstLayout.centerY - 8}
                  className="sunburst-center-title"
                  textAnchor="middle"
                >
                  {currentDirectory.name}
                </text>
                <text
                  x={sunburstLayout.centerX}
                  y={sunburstLayout.centerY + 12}
                  className="sunburst-center-size"
                  textAnchor="middle"
                >
                  {formatBytes(currentDirectory.size, 1)}
                </text>
                {breadcrumbs.length > 1 && (
                  <text
                    x={sunburstLayout.centerX}
                    y={sunburstLayout.centerY + 26}
                    className="sunburst-center-hint"
                    textAnchor="middle"
                  >
                    Click to go up
                  </text>
                )}
              </g>
            </svg>
          ) : (
            <div className="treemap-loader-container">
              <div className="treemap-loader-spinner" />
              <span className="treemap-loader-text">Loading visualization...</span>
            </div>
          )}

          {/* Floating Tooltip */}
          {hoveredArc && (
            <div className="sunburst-floating-tooltip" style={getTooltipStyle()}>
              <div className="tooltip-name">{hoveredArc.arc.node.name}</div>
              <div className="tooltip-size">{formatBytes(hoveredArc.arc.node.size)}</div>
              <div className="tooltip-path">
                {hoveredArc.arc.node.path || hoveredArc.arc.node.name}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Cleanup & Selection Bar */}
      <div className="sunburst-bottom-bar">
        <div className="selection-stats">
          <div className="stat-highlight">
            <span className="stat-number">{formatBytes(totalCleanupBytes)}</span>
            <span className="stat-label">selected</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-highlight">
            <span className="stat-number">{cleanupList.length}</span>
            <span className="stat-label">{cleanupList.length === 1 ? 'item selected' : 'items selected'}</span>
          </div>
        </div>

        <div className="bottom-actions">
          <button
            type="button"
            className="btn-review-remove"
            disabled={cleanupList.length === 0}
            onClick={() => onOpenCleanupModal && onOpenCleanupModal()}
          >
            <Layers size={16} />
            <span>Review to Remove</span>
          </button>
        </div>
      </div>
    </div>
  );
};
