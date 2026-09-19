import React, { useEffect } from 'react';
import {
  Zap,
  Home,
  Users,
  AppWindow,
  Download,
  FileText,
  FolderOpen,
  Trash2,
  Code2,
  Package,
  Layers,
  Smartphone,
  Container,
  Film,
  HardDrive,
  Archive,
  Cloud,
  Server,
  Check,
  Folder
} from 'lucide-react';
import { useStorageStore } from '../../stores/storageStore';
import { formatBytes } from '@shared/utils/formatters';
import type { QuickTarget } from '@shared/types/ipc';
import './Sidebar.css';

const SMART_FILTER_ITEMS = [
  { id: 'node', label: 'Node.js', icon: Package },
  { id: 'xcode', label: 'Xcode', icon: Code2 },
  { id: 'artifacts', label: 'Build Artifacts', icon: Layers },
  { id: 'android', label: 'Android SDK', icon: Smartphone },
  { id: 'docker', label: 'Docker Data', icon: Container },
  { id: 'videos', label: 'Videos', icon: Film },
  { id: 'disk_images', label: 'Disk Images', icon: HardDrive },
  { id: 'archives', label: 'Archives', icon: Archive },
  { id: 'ios_backups', label: 'iOS Backups', icon: Cloud },
  { id: 'virtual_machines', label: 'Virtual Machines', icon: Server },
  { id: 'large_media', label: 'Large Media', icon: Film },
  { id: 'logs_caches', label: 'Caches & Logs', icon: Folder }
];

const FILE_TYPE_LEGEND = [
  { label: 'Video', color: '#e11d48' },
  { label: 'Image', color: '#db2777' },
  { label: 'Doc', color: '#2563eb' },
  { label: 'Dev', color: '#059669' },
  { label: 'Archive', color: '#c2410c' },
  { label: 'Other', color: '#475569' }
];

export const Sidebar: React.FC = () => {
  const {
    startScan,
    init,
    quickTargets,
    currentScanPath,
    scanStatus,
    diskSpace,
    trashInfo,
    platform,
    devFilters,
    toggleDevFilter,
    cleanupList
  } = useStorageStore();

  useEffect(() => {
    init();
  }, [init]);

  const handleScanFullDisk = () => {
    const root = platform === 'win32' ? 'C:\\' : '/';
    startScan(root);
  };

  const handleScanHome = () => {
    startScan('~');
  };

  const handleChooseFolder = async () => {
    if (window.storageAPI) {
      try {
        const path = await window.storageAPI.selectFolder();
        if (path) {
          startScan(path);
        }
      } catch (err) {
        console.error('Failed to select folder:', err);
      }
    }
  };

  const getTargetIcon = (iconType: QuickTarget['iconType']) => {
    switch (iconType) {
      case 'home':
        return <Home size={14} color="#38bdf8" />;
      case 'users':
        return <Users size={14} color="#a855f7" />;
      case 'applications':
        return <AppWindow size={14} color="#06b6d4" />;
      case 'downloads':
        return <Download size={14} color="#f97316" />;
      case 'documents':
        return <FileText size={14} color="#10b981" />;
      default:
        return <Folder size={14} color="#94a3b8" />;
    }
  };

  // Donut Gauge math
  const usedPercentage = diskSpace ? diskSpace.percentage : 48;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (usedPercentage / 100) * circumference;

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        {/* Top Scan Actions */}
        <div className="sidebar-actions">
          <button type="button" className="btn-scan-primary" onClick={handleScanFullDisk}>
            <Zap size={16} />
            <span>{platform === 'darwin' ? 'Scan Full Mac' : 'Scan Full Disk'}</span>
          </button>
          <button type="button" className="btn-scan-secondary" onClick={handleScanHome}>
            <Home size={15} color="#38bdf8" />
            <span>Scan Home</span>
          </button>
          <button type="button" className="btn-scan-secondary" onClick={handleChooseFolder}>
            <FolderOpen size={15} color="#818cf8" />
            <span>Choose Folder</span>
          </button>
        </div>

        {/* Quick Locations */}
        {quickTargets.length > 0 && (
          <div>
            <div className="sidebar-section-heading">QUICK LOCATIONS</div>
            <div className="sidebar-quick-list">
              {quickTargets.map((target) => {
                const isActive = currentScanPath === target.path;
                return (
                  <button
                    key={target.id}
                    type="button"
                    className={`quick-loc-item ${isActive ? 'active' : ''}`}
                    onClick={() => startScan(target.path)}
                    title={target.path}
                  >
                    <div className="quick-loc-icon">{getTargetIcon(target.iconType)}</div>
                    <span className="quick-loc-name">{target.name}</span>
                    {isActive && (
                      <span className="quick-loc-badge">
                        {scanStatus === 'scanning' ? 'Scanning' : 'Active'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Disk Storage Gauge */}
        <div>
          <div className="sidebar-section-heading">DISK STORAGE</div>
          <div className="disk-storage-card">
            <div className="donut-gauge">
              <svg className="donut-svg" width="52" height="52" viewBox="0 0 52 52">
                <circle
                  className="donut-circle-bg"
                  cx="26"
                  cy="26"
                  r={radius}
                  fill="none"
                />
                <circle
                  className="donut-circle-fg"
                  cx="26"
                  cy="26"
                  r={radius}
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="donut-text">{usedPercentage}%</div>
            </div>

            <div className="disk-stats-list">
              <div className="disk-stat-row">
                <span className="disk-stat-lbl">Total</span>
                <span className="disk-stat-val">
                  {diskSpace ? formatBytes(diskSpace.total, 1) : '245.11 GB'}
                </span>
              </div>
              <div className="disk-stat-row">
                <span className="disk-stat-lbl">Used</span>
                <span className="disk-stat-val">
                  {diskSpace ? formatBytes(diskSpace.used, 1) : '119.21 GB'}
                </span>
              </div>
              <div className="disk-stat-row">
                <span className="disk-stat-lbl">Available</span>
                <span className="disk-stat-val highlight">
                  {diskSpace ? formatBytes(diskSpace.free, 1) : '125.89 GB'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cleanup Queue Section */}
        {cleanupList.length > 0 && (
          <div>
            <div className="sidebar-section-heading">CLEANUP QUEUE</div>
            <div
              className="quick-loc-item"
              style={{
                borderColor: 'rgba(245, 158, 11, 0.35)',
                background: 'rgba(245, 158, 11, 0.08)'
              }}
            >
              <div className="quick-loc-icon">
                <Layers size={14} color="#f59e0b" />
              </div>
              <span className="quick-loc-name" style={{ color: '#fde047', fontWeight: 600 }}>
                {cleanupList.length} {cleanupList.length === 1 ? 'item' : 'items'} ({formatBytes(cleanupList.reduce((acc, it) => acc + it.size, 0), 1)})
              </span>
            </div>
          </div>
        )}

        {/* Trash Monitor */}
        <div className="trash-row">
          <div className="trash-left">
            <Trash2 size={15} color="#f59e0b" />
            <span>Trash <span className="trash-badge">{trashInfo?.itemCount || 0} items</span></span>
          </div>
          <span className="trash-action">Empty</span>
        </div>

        {/* Smart Filters */}
        <div>
          <div className="sidebar-section-heading">SMART FILTERS</div>
          <div className="filter-list">
            {SMART_FILTER_ITEMS.map((item) => {
              const Icon = item.icon;
              const isChecked = !!devFilters[item.id];
              return (
                <div
                  key={item.id}
                  className={`filter-item ${isChecked ? 'active' : ''}`}
                  onClick={() => toggleDevFilter(item.id)}
                >
                  <div className="filter-checkbox">
                    {isChecked && <Check size={10} color="#ffffff" />}
                  </div>
                  <div className="filter-icon"><Icon size={14} /></div>
                  <span className="filter-label">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* File Types Legend */}
        <div>
          <div className="sidebar-section-heading">FILE TYPES</div>
          <div className="legend-grid">
            {FILE_TYPE_LEGEND.map((t) => (
              <div key={t.label} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: t.color }} />
                <span>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sidebar-footer">
        StorageUnleash v0.1.0
      </div>
    </aside>
  );
};
