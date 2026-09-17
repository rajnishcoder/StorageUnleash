import React, { useEffect } from 'react';
import {
  Home,
  Users,
  AppWindow,
  Download,
  FileText,
  HardDrive,
  FolderOpen,
  PieChart,
  Layers
} from 'lucide-react';
import { useStorageStore } from '../../stores/storageStore';
import type { QuickTarget } from '@shared/types/ipc';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const {
    quickTargets,
    currentScanPath,
    scanStatus,
    startScan,
    resetToHome,
    init,
    platform
  } = useStorageStore();

  useEffect(() => {
    init();
  }, [init]);

  const handleSelectFolder = async () => {
    if (window.storageAPI) {
      try {
        const selected = await window.storageAPI.selectFolder();
        if (selected) {
          startScan(selected);
        }
      } catch (err) {
        console.error('Failed to select folder:', err);
      }
    }
  };

  const getTargetIcon = (iconType: QuickTarget['iconType']) => {
    switch (iconType) {
      case 'home':
        return <Home size={16} />;
      case 'users':
        return <Users size={16} />;
      case 'applications':
        return <AppWindow size={16} />;
      case 'downloads':
        return <Download size={16} />;
      case 'documents':
        return <FileText size={16} />;
      case 'disk':
      default:
        return <HardDrive size={16} />;
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header" onClick={resetToHome} title="Return to Overview">
        <div className="sidebar-logo">
          <PieChart size={16} />
        </div>
        <span className="sidebar-title">StorageUnleash</span>
      </div>

      <div className="sidebar-content">
        <div className="sidebar-section">
          <div className="sidebar-section-title">Navigation</div>
          <button
            type="button"
            className={`sidebar-item ${scanStatus === 'idle' ? 'active' : ''}`}
            onClick={resetToHome}
          >
            <span className="sidebar-item-icon"><Layers size={16} /></span>
            <span className="sidebar-item-text">Overview</span>
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Quick Access</div>
          {quickTargets.map((target) => {
            const isActive = currentScanPath === target.path && scanStatus !== 'idle';
            return (
              <button
                key={target.id}
                type="button"
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => startScan(target.path)}
                title={target.path}
              >
                <span className="sidebar-item-icon">{getTargetIcon(target.iconType)}</span>
                <span className="sidebar-item-text">{target.name}</span>
                {isActive && scanStatus === 'scanning' && (
                  <span className="sidebar-item-badge">Scanning</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Custom Locations</div>
          <button
            type="button"
            className="sidebar-item"
            onClick={handleSelectFolder}
          >
            <span className="sidebar-item-icon"><FolderOpen size={16} /></span>
            <span className="sidebar-item-text">Analyze Folder...</span>
          </button>
          <button
            type="button"
            className="sidebar-item"
            onClick={handleSelectFolder}
          >
            <span className="sidebar-item-icon"><HardDrive size={16} /></span>
            <span className="sidebar-item-text">Analyze Disk...</span>
          </button>
        </div>
      </div>

      <div className="sidebar-footer">
        <span>Storage Analyzer</span>
        <span style={{ textTransform: 'capitalize' }}>{platform}</span>
      </div>
    </aside>
  );
};
