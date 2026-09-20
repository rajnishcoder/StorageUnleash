import React, { useEffect, useMemo, useState } from 'react';
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
  Folder,
  Bot,
  FileCode,
  Image as ImageIcon,
  Music,
  Globe,
  MessageSquare,
  Gamepad2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useStorageStore } from '../../stores/storageStore';
import { formatBytes } from '@shared/utils/formatters';
import { calculateSmartFilterStats } from '@shared/analyzer/filterMatcher';
import type { QuickTarget } from '@shared/types/ipc';
import '../common/ConfirmModal.css';
import './Sidebar.css';

const SMART_FILTER_ITEMS = [
  // Universal / Consumer Categories
  { id: 'photos', label: 'Photos & RAW Media', icon: ImageIcon },
  { id: 'videos', label: 'Videos', icon: Film },
  { id: 'audio', label: 'Music & Audio', icon: Music },
  { id: 'documents', label: 'Documents & PDFs', icon: FileText },
  { id: 'browser_caches', label: 'Browser Data', icon: Globe },
  { id: 'mail_messages', label: 'Mail & Messages', icon: MessageSquare },
  { id: 'disk_images', label: 'Disk Images & Installers', icon: HardDrive },
  { id: 'archives', label: 'Archives & Zips', icon: Archive },
  { id: 'large_media', label: 'Large Files (>100M)', icon: Film },
  { id: 'games', label: 'Games & Steam Data', icon: Gamepad2 },
  { id: 'logs_caches', label: 'Caches & Logs', icon: Folder },
  { id: 'ios_backups', label: 'iOS Backups', icon: Cloud },

  // Developer & Power Tools
  { id: 'ai_models', label: 'AI & LLM Models', icon: Bot },
  { id: 'node', label: 'Node.js & npm', icon: Package },
  { id: 'python', label: 'Python & Envs', icon: FileCode },
  { id: 'docker', label: 'Docker Data', icon: Container },
  { id: 'xcode', label: 'Xcode & Simulators', icon: Code2 },
  { id: 'android', label: 'Android SDK', icon: Smartphone },
  { id: 'artifacts', label: 'Build Artifacts', icon: Layers },
  { id: 'virtual_machines', label: 'Virtual Machines', icon: Server }
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
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [isConfirmEmptyTrashOpen, setIsConfirmEmptyTrashOpen] = useState(false);
  const [isEmptyingTrash, setIsEmptyingTrash] = useState(false);

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
    cleanupList,
    currentDirectory,
    scanResult,
    openTrash,
    emptyTrash
  } = useStorageStore();

  const handleEmptyTrash = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!trashInfo || trashInfo.itemCount === 0) return;
    setIsConfirmEmptyTrashOpen(true);
  };

  const handleConfirmEmpty = async () => {
    setIsEmptyingTrash(true);
    try {
      await emptyTrash();
    } finally {
      setIsEmptyingTrash(false);
      setIsConfirmEmptyTrashOpen(false);
    }
  };

  const deferredCurrentDir = React.useDeferredValue(currentDirectory);
  const deferredScanResult = React.useDeferredValue(scanResult);

  const filterStats = useMemo(() => {
    return calculateSmartFilterStats(deferredCurrentDir || deferredScanResult?.root || null);
  }, [deferredCurrentDir, deferredScanResult]);

  const { activeFilterItems, inactiveFilterItems } = useMemo(() => {
    const active: typeof SMART_FILTER_ITEMS = [];
    const inactive: typeof SMART_FILTER_ITEMS = [];

    for (const item of SMART_FILTER_ITEMS) {
      const stat = filterStats[item.id] || { size: 0, count: 0 };
      const isChecked = !!devFilters[item.id];
      if (stat.size > 0 || isChecked) {
        active.push(item);
      } else {
        inactive.push(item);
      }
    }

    // Sort active by size descending
    active.sort((a, b) => {
      const sizeA = filterStats[a.id]?.size || 0;
      const sizeB = filterStats[b.id]?.size || 0;
      return sizeB - sizeA;
    });

    return { activeFilterItems: active, inactiveFilterItems: inactive };
  }, [filterStats, devFilters]);

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
          <div
            className="trash-left"
            onClick={() => openTrash()}
            title={`Click to open ${platform === 'darwin' ? 'Trash in Finder' : 'Recycle Bin'}`}
          >
            <div className="trash-icon-wrap">
              <Trash2 size={15} color="#f59e0b" />
            </div>
            <div className="trash-text-group">
              <div className="trash-title-line">
                <span className="trash-title">{platform === 'darwin' ? 'Trash' : 'Recycle Bin'}</span>
                {trashInfo && trashInfo.totalSize > 0 && (
                  <span className="trash-size-badge" title="Total storage occupied by Trash">
                    {formatBytes(trashInfo.totalSize, 1)}
                  </span>
                )}
              </div>
              <span className="trash-subtitle">
                {trashInfo && trashInfo.itemCount > 0
                  ? `${trashInfo.itemCount.toLocaleString()} ${trashInfo.itemCount === 1 ? 'item' : 'items'}`
                  : 'Empty'}
              </span>
            </div>
          </div>

          {(trashInfo?.itemCount || 0) > 0 && (
            <button
              type="button"
              className="trash-action-btn"
              onClick={handleEmptyTrash}
              title={`Permanently empty ${platform === 'darwin' ? 'Trash' : 'Recycle Bin'}`}
            >
              Empty
            </button>
          )}
        </div>

        {/* Smart Filters */}
        <div>
          <div className="sidebar-section-heading">SMART FILTERS</div>
          <div className="filter-list">
            {(activeFilterItems.length > 0 ? activeFilterItems : SMART_FILTER_ITEMS.slice(0, 8)).map((item) => {
              const Icon = item.icon;
              const isChecked = !!devFilters[item.id];
              const stat = filterStats[item.id] || { size: 0, count: 0 };
              const hasSize = stat.size > 0;

              return (
                <div
                  key={item.id}
                  className={`filter-item ${isChecked ? 'active' : ''} ${!hasSize ? 'zero-stat' : ''}`}
                  onClick={() => toggleDevFilter(item.id)}
                  title={
                    hasSize
                      ? `${item.label} • ${stat.count.toLocaleString()} ${stat.count === 1 ? 'item' : 'items'} (${formatBytes(stat.size)})`
                      : `${item.label} • 0 items found in current scan`
                  }
                >
                  <div className="filter-checkbox">
                    {isChecked && <Check size={10} color="#ffffff" />}
                  </div>
                  <div className="filter-icon"><Icon size={14} /></div>
                  <span className="filter-label">{item.label}</span>
                  {hasSize ? (
                    <span className="filter-size-badge">{formatBytes(stat.size, 1)}</span>
                  ) : (
                    <span className="filter-size-zero">0 B</span>
                  )}
                </div>
              );
            })}

            {/* Inactive filters (when expanded) */}
            {showAllFilters &&
              (activeFilterItems.length > 0 ? inactiveFilterItems : SMART_FILTER_ITEMS.slice(8)).map((item) => {
                const Icon = item.icon;
                const isChecked = !!devFilters[item.id];
                const stat = filterStats[item.id] || { size: 0, count: 0 };
                const hasSize = stat.size > 0;

                return (
                  <div
                    key={item.id}
                    className={`filter-item ${isChecked ? 'active' : ''} ${!hasSize ? 'zero-stat' : ''}`}
                    onClick={() => toggleDevFilter(item.id)}
                    title={
                      hasSize
                        ? `${item.label} • ${stat.count.toLocaleString()} ${stat.count === 1 ? 'item' : 'items'} (${formatBytes(stat.size)})`
                        : `${item.label} • 0 items found in current scan`
                    }
                  >
                    <div className="filter-checkbox">
                      {isChecked && <Check size={10} color="#ffffff" />}
                    </div>
                    <div className="filter-icon"><Icon size={14} /></div>
                    <span className="filter-label">{item.label}</span>
                    {hasSize ? (
                      <span className="filter-size-badge">{formatBytes(stat.size, 1)}</span>
                    ) : (
                      <span className="filter-size-zero">0 B</span>
                    )}
                  </div>
                );
              })}

            {/* Toggle button to expand/collapse unused categories */}
            {(activeFilterItems.length > 0 ? inactiveFilterItems.length : SMART_FILTER_ITEMS.length - 8) > 0 && (
              <button
                type="button"
                className="btn-toggle-filters"
                onClick={() => setShowAllFilters((prev) => !prev)}
              >
                {showAllFilters ? (
                  <>
                    <span>Show fewer categories</span>
                    <ChevronUp size={12} />
                  </>
                ) : (
                  <>
                    <span>
                      + {activeFilterItems.length > 0 ? inactiveFilterItems.length : SMART_FILTER_ITEMS.length - 8} more categories
                    </span>
                    <ChevronDown size={12} />
                  </>
                )}
              </button>
            )}
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

      {/* Empty Trash Confirmation Dialog */}
      {isConfirmEmptyTrashOpen && (
        <div className="modal-overlay" onClick={() => !isEmptyingTrash && setIsConfirmEmptyTrashOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div
                className="modal-icon-wrapper"
                style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}
              >
                <Trash2 size={22} />
              </div>
              <div className="modal-title">Empty {platform === 'darwin' ? 'Trash' : 'Recycle Bin'}?</div>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to permanently delete all{' '}
                <strong>{trashInfo?.itemCount} items</strong>
                {trashInfo?.totalSize ? ` (${formatBytes(trashInfo.totalSize)})` : ''} in the{' '}
                {platform === 'darwin' ? 'Trash' : 'Recycle Bin'}?
              </p>
              <div style={{ fontSize: '12px', color: '#f43f5e', marginTop: '8px', fontWeight: 500 }}>
                ⚠️ This action is permanent and cannot be undone.
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn cancel"
                onClick={() => setIsConfirmEmptyTrashOpen(false)}
                disabled={isEmptyingTrash}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn confirm-trash"
                onClick={handleConfirmEmpty}
                disabled={isEmptyingTrash}
              >
                {isEmptyingTrash
                  ? 'Emptying...'
                  : `Empty ${platform === 'darwin' ? 'Trash' : 'Recycle Bin'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
