import React, { useEffect } from 'react';
import {
  Zap,
  Home,
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
  Check
} from 'lucide-react';
import { useStorageStore } from '../../stores/storageStore';
import { formatBytes } from '@shared/utils/formatters';
import './Sidebar.css';

const DEV_BLOAT_ITEMS = [
  { id: 'node', label: 'Node.js', icon: Package },
  { id: 'xcode', label: 'Xcode', icon: Code2 },
  { id: 'artifacts', label: 'Build Artifacts', icon: Layers },
  { id: 'android', label: 'Android', icon: Smartphone },
  { id: 'docker', label: 'Docker', icon: Container },
  { id: 'videos', label: 'Videos', icon: Film },
  { id: 'disk_images', label: 'Disk Images', icon: HardDrive },
  { id: 'archives', label: 'Archives', icon: Archive },
  { id: 'ios_backups', label: 'iOS Backups', icon: Cloud },
  { id: 'virtual_machines', label: 'Virtual Machines', icon: Server }
];

const FILE_TYPE_LEGEND = [
  { label: 'Video', color: '#f43f5e' },
  { label: 'Image', color: '#f97316' },
  { label: 'Doc', color: '#3b82f6' },
  { label: 'Dev', color: '#10b981' },
  { label: 'Archive', color: '#eab308' },
  { label: 'Other', color: '#64748b' }
];

export const Sidebar: React.FC = () => {
  const {
    startScan,
    init,
    diskSpace,
    trashInfo,
    platform,
    devFilters,
    toggleDevFilter
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

        {/* Trash Monitor */}
        <div className="trash-row">
          <div className="trash-left">
            <Trash2 size={15} color="#f59e0b" />
            <span>Trash <span className="trash-badge">{trashInfo?.itemCount || 0} items</span></span>
          </div>
          <span className="trash-action">Empty</span>
        </div>

        {/* Dev Bloat Filters */}
        <div>
          <div className="sidebar-section-heading">&lt;&gt; DEV BLOAT FILTERS</div>
          <div className="filter-list">
            {DEV_BLOAT_ITEMS.map((item) => {
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
