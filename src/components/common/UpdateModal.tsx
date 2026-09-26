import React from 'react';
import { Rocket, Sparkles, CheckCircle2, ExternalLink, X, Download, RefreshCw } from 'lucide-react';
import { useStorageStore } from '../../stores/storageStore';
import './UpdateModal.css';

export const UpdateModal: React.FC = () => {
  const {
    updateInfo,
    isCheckingUpdate,
    isUpdateModalOpen,
    setIsUpdateModalOpen,
    dismissUpdate
  } = useStorageStore();

  if (!isUpdateModalOpen) return null;

  const handleOpenDownload = () => {
    if (updateInfo?.downloadUrl) {
      if (window.storageAPI?.openExternalUrl) {
        window.storageAPI.openExternalUrl(updateInfo.downloadUrl);
      } else {
        window.open(updateInfo.downloadUrl, '_blank');
      }
    }
    setIsUpdateModalOpen(false);
  };

  const handleOpenReleases = () => {
    const url = updateInfo?.releaseUrl || 'https://github.com/rajnishcoder/StorageUnleash/releases/latest';
    if (window.storageAPI?.openExternalUrl) {
      window.storageAPI.openExternalUrl(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleClose = () => {
    dismissUpdate();
  };

  return (
    <div className="update-modal-overlay" onClick={handleClose}>
      <div className="update-modal-card glass-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="update-modal-close-btn"
          onClick={handleClose}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {isCheckingUpdate ? (
          <div className="update-modal-checking">
            <RefreshCw size={32} className="update-spinner" />
            <h3>Checking for updates...</h3>
            <p>Connecting to GitHub to verify the latest release.</p>
          </div>
        ) : updateInfo?.hasUpdate ? (
          <>
            <div className="update-modal-header">
              <div className="update-badge-icon">
                <Rocket size={26} color="#38bdf8" />
              </div>
              <h2 className="update-modal-title">New Version Available! 🎉</h2>
              <div className="update-versions-row">
                <span className="version-pill current">v{updateInfo.currentVersion}</span>
                <span className="version-arrow">→</span>
                <span className="version-pill latest">v{updateInfo.latestVersion}</span>
              </div>
            </div>

            <div className="update-modal-body">
              <div className="update-release-title">
                <Sparkles size={15} color="#38bdf8" />
                <span>{updateInfo.releaseName || `Storage Unleashed v${updateInfo.latestVersion}`}</span>
              </div>

              {updateInfo.releaseNotes ? (
                <div className="update-notes-box">
                  <pre>{updateInfo.releaseNotes}</pre>
                </div>
              ) : (
                <p className="update-generic-desc">
                  A new release of Storage Unleashed is available with performance improvements, UI enhancements, and bug fixes.
                </p>
              )}

              <div className="update-install-hint">
                💡 Download the new <code>.dmg</code> and replace the app in your <code>/Applications</code> folder. All your data and settings are preserved.
              </div>
            </div>

            <div className="update-modal-actions">
              <button
                type="button"
                className="update-btn secondary"
                onClick={handleOpenReleases}
              >
                <span>Release Notes</span>
                <ExternalLink size={13} />
              </button>
              <button
                type="button"
                className="update-btn primary"
                onClick={handleOpenDownload}
              >
                <Download size={15} />
                <span>Download DMG (v{updateInfo.latestVersion})</span>
              </button>
            </div>
          </>
        ) : (
          <div className="update-modal-up-to-date">
            <div className="update-badge-icon success">
              <CheckCircle2 size={28} color="#10b981" />
            </div>
            <h2 className="update-modal-title">You're Up to Date!</h2>
            <p className="update-subtitle">
              Storage Unleashed <strong>v{updateInfo?.currentVersion || '1.0.0'}</strong> is the latest version available.
            </p>
            <div className="update-modal-actions" style={{ justifyContent: 'center', marginTop: '20px' }}>
              <button
                type="button"
                className="update-btn primary"
                onClick={() => setIsUpdateModalOpen(false)}
              >
                <span>Awesome</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
