import React, { useState } from 'react';
import { useStorageStore } from '../../stores/storageStore';
import { Breadcrumbs } from '../../components/storage/Breadcrumbs';
import { TreemapView } from '../../components/visualization/TreemapView';
import { LargestFilesView } from '../../components/storage/LargestFilesView';
import { FileTypesView } from '../../components/storage/FileTypesView';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { formatBytes, formatNumber } from '@shared/utils/formatters';
import { LayoutGrid, ListOrdered, PieChart, ExternalLink, Trash2, X, Folder, File } from 'lucide-react';
import type { FileNode } from '@shared/models/fileNode';
import './StoragePage.css';

export const StoragePage: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedNode,
    selectNode,
    removePathFromTree,
    platform
  } = useStorageStore();

  const [trashCandidate, setTrashCandidate] = useState<FileNode | null>(null);

  const handleReveal = async (path: string) => {
    if (window.storageAPI) {
      try {
        await window.storageAPI.revealInFileManager(path);
      } catch (err) {
        console.error('Failed to reveal file:', err);
      }
    }
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

  return (
    <div className="storage-page-container">
      <Breadcrumbs />

      <div className="storage-page-toolbar">
        <div className="view-tabs">
          <button
            type="button"
            className={`view-tab-btn ${activeTab === 'treemap' ? 'active' : ''}`}
            onClick={() => setActiveTab('treemap')}
          >
            <LayoutGrid size={14} />
            <span>Treemap</span>
          </button>
          <button
            type="button"
            className={`view-tab-btn ${activeTab === 'largest-files' ? 'active' : ''}`}
            onClick={() => setActiveTab('largest-files')}
          >
            <ListOrdered size={14} />
            <span>Largest Files</span>
          </button>
          <button
            type="button"
            className={`view-tab-btn ${activeTab === 'file-types' ? 'active' : ''}`}
            onClick={() => setActiveTab('file-types')}
          >
            <PieChart size={14} />
            <span>File Categories</span>
          </button>
        </div>
      </div>

      <div className="storage-content-layout">
        <div className="storage-main-view">
          {activeTab === 'treemap' && <TreemapView />}
          {activeTab === 'largest-files' && (
            <LargestFilesView onTrashRequest={(node) => setTrashCandidate(node)} />
          )}
          {activeTab === 'file-types' && <FileTypesView />}
        </div>

        {/* Selected Node Details Pane (Treemap tab) */}
        {activeTab === 'treemap' && selectedNode && (
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
              {selectedNode.type === 'directory' ? <Folder size={20} color="#38bdf8" /> : <File size={20} color="#a855f7" />}
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
                <span className="details-meta-val" style={{ textTransform: 'capitalize' }}>{selectedNode.type}</span>
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

      <ConfirmModal
        isOpen={!!trashCandidate}
        node={trashCandidate}
        onClose={() => setTrashCandidate(null)}
        onConfirm={handleConfirmTrash}
        platform={platform}
      />
    </div>
  );
};
