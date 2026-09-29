import React from 'react';
import { ShieldAlert, Settings, RefreshCw, Lock, ExternalLink } from 'lucide-react';
import { useStorageStore } from '../../stores/storageStore';
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
  const { platformDetails } = useStorageStore();
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

        <div className="permission-badge-tag">{platformDetails.platformName} Security & Permissions</div>

        <h2 className="permission-title">
          Permission Required for <span className="highlight-folder">"{folderName}"</span>
        </h2>

        {platformDetails.isWindows ? (
          <>
            <p className="permission-desc">
              Windows restricts standard applications from reading protected system directories (such as <code>System Volume Information</code> or protected user profiles). Running Storage Unleashed with <strong>Administrator privileges</strong> grants full access to scan all drives.
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
                  Close Storage Unleashed and find its shortcut on your Desktop or Start Menu.
                </span>
              </div>
              <div className="permission-step-item">
                <span className="step-num">2</span>
                <span className="step-text">
                  Right-click the icon and choose <strong>"Run as administrator"</strong>.
                </span>
              </div>
              <div className="permission-step-item">
                <span className="step-num">3</span>
                <span className="step-text">
                  Return to Storage Unleashed and click <strong>"Try Scanning Again"</strong>.
                </span>
              </div>
            </div>

            <div className="permission-tip-box">
              💡 <strong>Tip:</strong> You can also choose a different folder to scan by selecting <strong>Analyze a Folder</strong> from the sidebar.
            </div>
          </>
        ) : (
          <>
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
                  Under <strong>Full Disk Access</strong>, toggle <strong>Storage Unleashed</strong> to <strong>ON</strong> (or click <strong>+</strong> to add it).
                </span>
              </div>
              <div className="permission-step-item">
                <span className="step-num">3</span>
                <span className="step-text">
                  Return to Storage Unleashed and click <strong>"Try Scanning Again"</strong>.
                </span>
              </div>
            </div>

            <div className="permission-tip-box">
              💡 <strong>Tip:</strong> Full Disk Access grants complete read permission across all macOS containers with <strong>1 single toggle</strong> instead of manually clicking individual folder switches.
            </div>
          </>
        )}

        <div className="permission-actions-row">
          <button
            type="button"
            className="btn-open-settings"
            onClick={handleOpenPrivacySettings}
          >
            <Settings size={16} />
            <span>{platformDetails.isWindows ? 'Open Windows Privacy Settings' : 'Open Full Disk Access'}</span>
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
