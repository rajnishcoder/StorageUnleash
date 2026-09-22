import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatBytes, truncatePath } from '@shared/utils/formatters';
import type { FileNode } from '@shared/models/fileNode';
import './ConfirmModal.css';

interface ConfirmModalProps {
  node: FileNode | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  platform: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  node,
  isOpen,
  onClose,
  onConfirm,
  platform
}) => {
  if (!isOpen || !node) return null;

  const trashName = platform === 'darwin' ? 'Trash' : 'Recycle Bin';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon-wrapper">
            <Trash2 size={22} />
          </div>
          <div className="modal-title">Move to {trashName}?</div>
        </div>

        <div className="modal-body">
          <p>
            Are you sure you want to move this item to the {trashName}? This item can normally be restored if needed.
          </p>
          <div className="modal-item-preview">
            <div className="modal-item-name">{node.name}</div>
            <div className="modal-item-size">{formatBytes(node.size)}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {truncatePath(node.path, 50)}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="modal-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="modal-btn confirm-trash" onClick={onConfirm}>
            <Trash2 size={14} />
            <span>Move to {trashName}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
