import React from 'react';
import { FolderOpen, HardDrive, ShieldCheck, Sparkles, Home, Users, AppWindow, Download } from 'lucide-react';
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
        <div style={{ width: '100%', maxWidth: '580px', marginTop: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Quick Locations
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
            {quickTargets.map((target) => (
              <button
                key={target.id}
                type="button"
                className="action-card"
                style={{ padding: '14px 10px' }}
                onClick={() => startScan(target.path)}
              >
                <div style={{ color: 'var(--accent-primary)', marginBottom: '6px' }}>
                  {getTargetIcon(target.iconType)}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{target.name}</span>
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
