import React, { useState } from 'react';
import { useStorageStore } from '../../stores/storageStore';
import { Breadcrumbs } from '../../components/storage/Breadcrumbs';
import { TreemapView } from '../../components/visualization/TreemapView';
import { SunburstView } from '../../components/visualization/SunburstView';
import { LargestFilesView } from '../../components/storage/LargestFilesView';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { ContextMenu } from '../../components/common/ContextMenu';
import { CleanupListModal } from '../../components/storage/CleanupListModal';
import { formatBytes, formatNumber } from '@shared/utils/formatters';
import { ExternalLink, Trash2, X, Folder, File, Layers, Check } from 'lucide-react';
import type { FileNode } from '@shared/models/fileNode';
import './StoragePage.css';

export const StoragePage: React.FC = () => {
  const {
    viewMode,
    selectedNode,
    selectNode,
    removePathFromTree,
    removePathsFromTree,
    cleanupList,
    toggleCleanupItem,
    platform
  } = useStorageStore();

  const [trashCandidate, setTrashCandidate] = useState<FileNode | null>(null);
  const [contextMenuTarget, setContextMenuTarget] = useState<{ node: FileNode; x: number; y: number } | null>(null);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);

  const handleReveal = async (path: string) => {
    if (window.storageAPI) {
      try {
        await window.storageAPI.revealInFileManager(path);
      } catch (err) {
        console.error('Failed to reveal file:', err);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    setContextMenuTarget({
      node,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleConfirmTrash = async () => {
    if (!trashCandidate) return;

    if (window.storageAPI) {
      try {
        const result = await window.storageAPI.moveToTrash([trashCandidate.path]);
        if (result.success) {
          removePathFromTree(trashCandidate.path);
        } else {
          alert('Failed to move item to trash: ' + (result.results[0]?.error || 'Unknown error'));
        }
      } catch (err: any) {
        alert('Error moving item to trash: ' + err?.message);
      }
    }
    setTrashCandidate(null);
  };

  const handleConfirmBatchClean = async (nodes: FileNode[]) => {
    if (!nodes || nodes.length === 0) return;

    if (window.storageAPI) {
      try {
        const paths = nodes.map((n) => n.path);
        const result = await window.storageAPI.moveToTrash(paths);
        const successfulPaths = result.results
          .filter((r) => r.success)
          .map((r) => r.path);

        if (successfulPaths.length > 0) {
          removePathsFromTree(successfulPaths);
        }

        if (!result.success) {
          const errors = result.results
            .filter((r) => !r.success)
            .map((r) => `${r.path}: ${r.error}`)
            .join('\n');
          alert('Some items could not be moved to trash:\n' + errors);
        }
      } catch (err: any) {
        alert('Error during cleanup: ' + err?.message);
      }
    }
    setIsCleanupModalOpen(false);
  };

  const totalCleanupBytes = cleanupList.reduce((acc, it) => acc + it.size, 0);

  return (
    <div className="storage-page-container">
      <Breadcrumbs />

      <div className="storage-content-layout">
        <div className="storage-main-view">
          {viewMode === 'treemap' ? (
            <TreemapView onContextMenu={handleContextMenu} />
          ) : viewMode === 'sunburst' ? (
            <SunburstView
              onContextMenu={handleContextMenu}
              onOpenCleanupModal={() => setIsCleanupModalOpen(true)}
            />
          ) : (
            <LargestFilesView
              onTrashRequest={(node) => setTrashCandidate(node)}
              onContextMenu={handleContextMenu}
            />
          )}
        </div>

        {/* Selected Node Details Pane */}
        {selectedNode && (
          <aside className="node-details-pane">
            <div className="details-header">
              <span className="details-title">Selected Item</span>
              <button
                type="button"
                onClick={() => selectNode(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedNode.type === 'directory' ? (
                <Folder size={20} color="#38bdf8" />
              ) : (
                <File size={20} color="#a855f7" />
              )}
              <div className="details-name">{selectedNode.name}</div>
            </div>

            <div className="details-path">{selectedNode.path}</div>

            <div className="details-meta-card">
              <div className="details-meta-row">
                <span className="details-meta-lbl">Size</span>
                <span className="details-meta-val">{formatBytes(selectedNode.size)}</span>
              </div>
              <div className="details-meta-row">
                <span className="details-meta-lbl">Type</span>
                <span className="details-meta-val" style={{ textTransform: 'capitalize' }}>
                  {selectedNode.type}
                </span>
              </div>
              {selectedNode.type === 'directory' && (
                <>
                  <div className="details-meta-row">
                    <span className="details-meta-lbl">Files</span>
                    <span className="details-meta-val">{formatNumber(selectedNode.fileCount || 0)}</span>
                  </div>
                  <div className="details-meta-row">
                    <span className="details-meta-lbl">Folders</span>
                    <span className="details-meta-val">{formatNumber(selectedNode.directoryCount || 0)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="details-actions">
              <button
                type="button"
                className="details-btn reveal"
                onClick={() => handleReveal(selectedNode.path)}
              >
                <ExternalLink size={14} />
                <span>{platform === 'darwin' ? 'Reveal in Finder' : 'Show in Explorer'}</span>
              </button>
              <button
                type="button"
                className="details-btn"
                style={{
                  color: cleanupList.some((it) => it.path === selectedNode.path) ? '#34d399' : '#f59e0b',
                  borderColor: cleanupList.some((it) => it.path === selectedNode.path) ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.3)'
                }}
                onClick={() => toggleCleanupItem(selectedNode)}
              >
                {cleanupList.some((it) => it.path === selectedNode.path) ? (
                  <>
                    <Check size={14} />
                    <span>In Cleanup List</span>
                  </>
                ) : (
                  <>
                    <Layers size={14} />
                    <span>Add to Cleanup</span>
                  </>
                )}
              </button>
              <button
                type="button"
                className="details-btn trash"
                onClick={() => setTrashCandidate(selectedNode)}
              >
                <Trash2 size={14} />
                <span>Move to Trash</span>
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* Floating Cleanup List Pill */}
      {cleanupList.length > 0 && (
        <div className="cleanup-floating-pill" onClick={() => setIsCleanupModalOpen(true)}>
          <div className="pill-left">
            <Layers size={15} color="#f59e0b" />
            <span>
              Cleanup Queue: <strong>{cleanupList.length} {cleanupList.length === 1 ? 'item' : 'items'}</strong> ({formatBytes(totalCleanupBytes)})
            </span>
          </div>
          <button
            type="button"
            className="pill-clean-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsCleanupModalOpen(true);
            }}
          >
            Review & Clean
          </button>
        </div>
      )}

      {/* Right Click Context Menu */}
      {contextMenuTarget && (
        <ContextMenu
          node={contextMenuTarget.node}
          x={contextMenuTarget.x}
          y={contextMenuTarget.y}
          platform={platform}
          isInCleanup={cleanupList.some((it) => it.path === contextMenuTarget.node.path)}
          onClose={() => setContextMenuTarget(null)}
          onReveal={(node) => handleReveal(node.path)}
          onTrash={(node) => setTrashCandidate(node)}
          onToggleCleanup={(node) => toggleCleanupItem(node)}
        />
      )}

      {/* Single Item Trash Confirmation Modal */}
      <ConfirmModal
        isOpen={!!trashCandidate}
        node={trashCandidate}
        onClose={() => setTrashCandidate(null)}
        onConfirm={handleConfirmTrash}
        platform={platform}
      />

      {/* Batch Cleanup List Modal */}
      <CleanupListModal
        isOpen={isCleanupModalOpen}
        onClose={() => setIsCleanupModalOpen(false)}
        onConfirmClean={handleConfirmBatchClean}
      />
    </div>
  );
};
