import React from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Folder, Sparkles } from 'lucide-react';
import { useStorageStore } from '../../stores/storageStore';
import { formatBytes } from '@shared/utils/formatters';
import './Breadcrumbs.css';

export const Breadcrumbs: React.FC = () => {
  const {
    breadcrumbs,
    currentDirectory,
    drillUp,
    rescan,
    scanStatus,
    hasPendingDiskChanges
  } = useStorageStore();

  const canGoBack = breadcrumbs.length > 1;

  const handleBack = () => {
    if (canGoBack) {
      drillUp(breadcrumbs.length - 2);
    }
  };

  return (
    <div className="breadcrumbs-bar">
      <div className="breadcrumbs-left">
        <button
          type="button"
          className="breadcrumb-back-btn"
          onClick={handleBack}
          disabled={!canGoBack}
          title="Go Up One Level"
        >
          <ChevronLeft size={16} />
        </button>

        {breadcrumbs.map((node, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <React.Fragment key={node.id || node.path || index}>
              <button
                type="button"
                className={`breadcrumb-item ${isLast ? 'active' : ''}`}
                onClick={() => !isLast && drillUp(index)}
              >
                <Folder size={14} style={{ opacity: isLast ? 1 : 0.6 }} />
                <span>{node.name || 'Root'}</span>
              </button>
              {!isLast && <ChevronRight size={12} className="breadcrumb-sep" />}
            </React.Fragment>
          );
        })}
      </div>

      <div className="breadcrumbs-right">
        {currentDirectory && (
          <div
            className={`dir-summary-badge ${hasPendingDiskChanges ? 'updated-badge' : ''}`}
            title={
              hasPendingDiskChanges
                ? 'Size dynamically updated after cleanup. Click Rescan to re-verify disk from filesystem.'
                : 'Current folder size'
            }
          >
            {hasPendingDiskChanges && <Sparkles size={11} color="#38bdf8" />}
            <span>{formatBytes(currentDirectory.size)}</span>
          </div>
        )}
        <button
          type="button"
          className={`rescan-btn ${hasPendingDiskChanges ? 'recommended' : ''}`}
          onClick={rescan}
          disabled={scanStatus === 'scanning'}
          title={
            hasPendingDiskChanges
              ? 'Items were deleted. Click to perform a fresh filesystem rescan.'
              : 'Rescan current target'
          }
        >
          <RefreshCw size={12} className={scanStatus === 'scanning' ? 'spinning' : ''} />
          <span>Rescan</span>
          {hasPendingDiskChanges && <span className="rescan-dot-indicator" />}
        </button>
      </div>
    </div>
  );
};
