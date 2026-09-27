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
        await window.storageAPI.openSystemPrivacySettings('full-disk');
      } catch (err) {
        console.error('Failed to open Privacy settings:', err);
      }
    }
  };

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
          macOS requires <strong>Full Disk Access</strong> to scan protected user directories and app caches. Enabling Full Disk Access grants access in a single master switch, avoiding dozens of individual folder prompts.
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
              Click <strong>"Open Full Disk Access Settings"</strong> below.
            </span>
          </div>
          <div className="permission-step-item">
            <span className="step-num">2</span>
            <span className="step-text">
              Under <strong>Full Disk Access</strong>, toggle <strong>StorageUnleash</strong> to <strong>ON</strong> (or click <strong>+</strong> to add it).
            </span>
          </div>
          <div className="permission-step-item">
            <span className="step-num">3</span>
            <span className="step-text">
              Return to StorageUnleash and click <strong>"Try Scanning Again"</strong>.
            </span>
          </div>
        </div>

        <div className="permission-tip-box">
          💡 <strong>Tip:</strong> Full Disk Access grants complete read permission across all macOS containers with <strong>1 single toggle</strong> instead of manually clicking individual folder switches.
        </div>

        <div className="permission-actions-row">
          <button
            type="button"
            className="btn-open-settings"
            onClick={handleOpenPrivacySettings}
          >
            <Settings size={16} />
            <span>Open Full Disk Access</span>
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
