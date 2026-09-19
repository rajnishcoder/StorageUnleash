import React from 'react';
import { FolderOpen, HardDrive, ShieldCheck, Sparkles, Home, Users, AppWindow, Download, FileText } from 'lucide-react';
import { useStorageStore } from '../../stores/storageStore';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const { startScan, quickTargets, platform } = useStorageStore();

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
        return <HardDrive size={18} />;
    }
  };

  return (
    <div className="home-container">
      <div className="home-badge">
        <span className="home-badge-dot" />
        <span>Storage Analyzer v0.1.0</span>
      </div>

      <h1 className="home-title">StorageUnleash</h1>
      <p className="home-subtitle">
        Understand and visualize what is consuming storage on your computer.
        Fast, modern, and private.
      </p>

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
          <span className="action-label">Analyze a Disk</span>
          <span className="action-description">Scan entire drive or mount point</span>
        </button>
      </div>

      {quickTargets.length > 0 && (
        <div className="quick-locations-container">
          <div className="quick-locations-title">
            Quick Locations
          </div>
          <div className="quick-locations-grid">
            {quickTargets.map((target) => (
              <button
                key={target.id}
                type="button"
                className="quick-location-card"
                onClick={() => startScan(target.path)}
                title={target.path}
              >
                <div className="quick-location-icon">
                  {getTargetIcon(target.iconType)}
                </div>
                <span className="quick-location-name">{target.name}</span>
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
          <span style={{ textTransform: 'capitalize' }}>Platform: {platform}</span>
        </div>
      </div>
    </div>
  );
};
