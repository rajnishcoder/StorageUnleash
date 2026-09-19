import React from 'react';
import { Layers, Trash2, X, File, Folder, AlertCircle } from 'lucide-react';
import { useStorageStore } from '../../stores/storageStore';
import { formatBytes, truncatePath } from '@shared/utils/formatters';
import type { FileNode } from '@shared/models/fileNode';
import './CleanupListModal.css';

interface CleanupListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClean: (nodes: FileNode[]) => void;
}

export const CleanupListModal: React.FC<CleanupListModalProps> = ({
  isOpen,
  onClose,
  onConfirmClean
}) => {
  const { cleanupList, removeFromCleanupList, clearCleanupList, platform } = useStorageStore();

  if (!isOpen) return null;

  const totalBytes = cleanupList.reduce((acc, it) => acc + it.size, 0);
  const trashName = platform === 'darwin' ? 'Trash' : 'Recycle Bin';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="cleanup-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="cleanup-modal-header">
          <div className="cleanup-header-left">
            <div className="cleanup-icon-badge">
              <Layers size={20} color="#f59e0b" />
            </div>
            <div>
              <div className="cleanup-title">Cleanup Queue</div>
              <div className="cleanup-subtitle">
                {cleanupList.length} {cleanupList.length === 1 ? 'item' : 'items'} queued ·{' '}
                <strong style={{ color: '#f59e0b' }}>{formatBytes(totalBytes)}</strong> reclaimable
              </div>
            </div>
          </div>
          <button
            type="button"
            className="cleanup-close-btn"
            onClick={onClose}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="cleanup-modal-body">
          {cleanupList.length === 0 ? (
            <div className="cleanup-empty-state">
              <AlertCircle size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
              <div>No items in cleanup list</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 4 }}>
                Right-click any folder or file to queue it for cleanup.
              </div>
            </div>
          ) : (
            <div className="cleanup-items-list">
              {cleanupList.map((item) => (
                <div key={item.path} className="cleanup-item-row">
                  <div className="cleanup-item-left">
                    {item.type === 'directory' ? (
                      <Folder size={18} color="#38bdf8" />
                    ) : (
                      <File size={18} color="#a855f7" />
                    )}
                    <div className="cleanup-item-info">
                      <div className="cleanup-item-name" title={item.name}>
                        {item.name}
                      </div>
                      <div className="cleanup-item-path" title={item.path}>
                        {truncatePath(item.path, 55)}
                      </div>
                    </div>
                  </div>

                  <div className="cleanup-item-right">
                    <span className="cleanup-item-size">{formatBytes(item.size)}</span>
                    <button
                      type="button"
                      className="cleanup-remove-item-btn"
                      onClick={() => removeFromCleanupList(item.path)}
                      title="Remove from queue"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cleanupList.length > 0 && (
          <div className="cleanup-modal-footer">
            <button
              type="button"
              className="cleanup-btn-clear"
              onClick={clearCleanupList}
            >
              Clear Queue
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="modal-btn cancel"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn confirm-trash"
                onClick={() => {
                  onConfirmClean(cleanupList);
                }}
              >
                <Trash2 size={14} />
                <span>Move All to {trashName} ({formatBytes(totalBytes)})</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
