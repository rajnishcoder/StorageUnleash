import React from 'react';
import { ShieldAlert, Settings, RefreshCw, Lock, ExternalLink } from 'lucide-react';
import type { FileNode } from '@shared/models/fileNode';
import './PermissionDeniedView.css';

interface PermissionDeniedViewProps {
  directory?: FileNode | null;
  onRescan: () => void;
}

export const PermissionDeniedView: React.FC<PermissionDeniedViewProps> = ({
  directory,
  onRescan
}) => {
  const folderName = directory?.name || 'this folder';
  const folderPath = directory?.path || '';

  const handleOpenPrivacySettings = async () => {
    if (window.storageAPI?.openSystemPrivacySettings) {
      try {
        await window.storageAPI.openSystemPrivacySettings('files-and-folders');
      } catch (err) {
        console.error('Failed to open Privacy settings:', err);
      }
    }
  };

  const isFullDisk = folderPath === '/' || folderPath.toLowerCase().includes('macintosh') || folderName.toLowerCase().includes('full');

  return (
    <div className="permission-denied-container">
      <div className="permission-denied-card glass-card">
        <div className="permission-icon-wrap">
          <ShieldAlert size={36} className="permission-shield-icon" />
          <div className="permission-lock-badge">
            <Lock size={14} />
          </div>
        </div>

        <div className="permission-badge-tag">macOS Security & Privacy</div>

        <h2 className="permission-title">
          Permission Required for <span className="highlight-folder">"{folderName}"</span>
        </h2>

        <p className="permission-desc">
          This folder currently appears empty (0 B). If you have files in <strong>"{folderName}"</strong>, macOS is restricting access until permission is enabled in System Settings.
        </p>

        {folderPath && (
          <div className="permission-path-pill" title={folderPath}>
            <code>{folderPath}</code>
          </div>
        )}

        <div className="permission-steps-box">
          <div className="permission-step-item">
            <span className="step-num">1</span>
            <span className="step-text">
              Click <strong>"Open System Settings"</strong> below.
            </span>
          </div>
          <div className="permission-step-item">
            <span className="step-num">2</span>
            <span className="step-text">
              Under <strong>{isFullDisk ? 'Full Disk Access' : 'Files and Folders'}</strong>, toggle <strong>StorageUnleash</strong> (or <strong>Electron</strong>) to <strong>ON</strong>.
            </span>
          </div>
          <div className="permission-step-item">
            <span className="step-num">3</span>
            <span className="step-text">
              Return to StorageUnleash and click <strong>"Try Scanning Again"</strong>.
            </span>
          </div>
        </div>

        <div className="permission-actions-row">
          <button
            type="button"
            className="btn-open-settings"
            onClick={handleOpenPrivacySettings}
          >
            <Settings size={16} />
            <span>Open System Settings</span>
            <ExternalLink size={13} style={{ opacity: 0.7 }} />
          </button>

          <button
            type="button"
            className="btn-retry-scan"
            onClick={onRescan}
          >
            <RefreshCw size={15} />
            <span>Try Scanning Again</span>
          </button>
        </div>
      </div>
    </div>
  );
};
