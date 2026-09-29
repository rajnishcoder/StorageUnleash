import React from 'react';
import { FolderOpen, HardDrive, ShieldCheck, Sparkles, Home, Users, AppWindow, Download, FileText, LayoutGrid } from 'lucide-react';
import { useStorageStore } from '../../stores/storageStore';
import { formatBytes } from '@shared/utils/formatters';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const { startScan, quickTargets, systemDisks, platformDetails } = useStorageStore();

  const handleSelectFolder = async () => {
    if (!window.storageAPI) {
      alert('Filesystem access requires running within the desktop application.');
      return;
    }

    try {
      const path = await window.storageAPI.selectFolder();
      if (path) {
        startScan(path);
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const getTargetIcon = (iconType: string) => {
    switch (iconType) {
      case 'home':
        return <Home size={18} />;
      case 'users':
        return <Users size={18} />;
      case 'applications':
        return <AppWindow size={18} />;
      case 'downloads':
        return <Download size={18} />;
      case 'documents':
        return <FileText size={18} />;
      default:
        return <LayoutGrid size={18} />;
    }
  };

  return (
    <div className="home-container">
      <div className="home-badge">
        <span className="home-badge-dot" />
        <span>Storage Analyzer v1.1.0 • {platformDetails.platformName}</span>
      </div>

      <h1 className="home-title">Storage Unleashed</h1>
      <p className="home-subtitle">
        Understand and visualize what is consuming storage on your computer.
        Fast, modern, and private.
      </p>

      {/* System Disks & Storage Drives */}
      {systemDisks.length > 0 && (
        <div className="home-drives-section">
          <div className="home-section-title">
            <span>Drives & Volumes ({systemDisks.length})</span>
          </div>
          <div className="home-drives-grid">
            {systemDisks.map((disk) => {
              const usedPercent = Math.min(100, Math.max(0, disk.percentage || 0));
              const isHigh = usedPercent >= 90;
              const isMid = usedPercent >= 75 && !isHigh;
              const barColor = isHigh ? '#ef4444' : isMid ? '#f59e0b' : '#38bdf8';

              return (
                <button
                  key={disk.id || disk.mount}
                  type="button"
                  className="home-drive-card"
                  onClick={() => startScan(disk.mount)}
                  title={`Click to scan ${disk.name} (${disk.mount})`}
                >
                  <div className="drive-card-header">
                    <div className="drive-icon-box">
                      <HardDrive size={22} color={barColor} />
                    </div>
                    <div className="drive-info">
                      <div className="drive-name-row">
                        <span className="drive-name">{disk.name}</span>
                        {disk.isSystemDrive && <span className="system-drive-pill">System</span>}
                      </div>
                      <span className="drive-mount">{disk.mount}</span>
                    </div>
                  </div>

                  <div className="drive-meter-wrap">
                    <div className="drive-meter-bar">
                      <div
                        className="drive-meter-fill"
                        style={{
                          width: `${usedPercent}%`,
                          backgroundColor: barColor
                        }}
                      />
                    </div>
                    <div className="drive-meter-labels">
                      <span>{formatBytes(disk.free)} free</span>
                      <span>{formatBytes(disk.total)}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Cards */}
      <div className="home-actions">
        <button
          className="action-card"
          onClick={handleSelectFolder}
          type="button"
        >
          <div className="action-icon-wrapper">
            <FolderOpen size={28} />
          </div>
          <span className="action-label">Analyze a Folder</span>
          <span className="action-description">Select any directory to inspect</span>
        </button>

        <button
          className="action-card"
          onClick={handleSelectFolder}
          type="button"
        >
          <div className="action-icon-wrapper">
            <HardDrive size={28} />
          </div>
          <span className="action-label">Custom Drive or Disk</span>
          <span className="action-description">Select external disk, USB or mount</span>
        </button>
      </div>

      {quickTargets.length > 0 && (
        <div className="home-quick-locations-container">
          <div className="home-quick-locations-title">
            Quick Locations
          </div>
          <div className="home-quick-locations-row">
            {quickTargets.map((target) => (
              <button
                key={target.id}
                type="button"
                className="home-quick-card"
                onClick={() => startScan(target.path)}
                title={target.path}
              >
                <div className="home-quick-icon">
                  {getTargetIcon(target.iconType)}
                </div>
                <span className="home-quick-name">{target.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="home-footer" style={{ marginTop: '32px' }}>
        <div className="footer-item">
          <ShieldCheck size={14} color="#38bdf8" />
          <span>Local & Private (No cloud upload)</span>
        </div>
        <span>•</span>
        <div className="footer-item">
          <Sparkles size={14} color="#818cf8" />
          <span>{platformDetails.platformName} Desktop</span>
        </div>
      </div>
    </div>
  );
};
