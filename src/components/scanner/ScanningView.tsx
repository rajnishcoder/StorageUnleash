import React from 'react';
import { FolderSearch } from 'lucide-react';
import { useStorageStore } from '../../stores/storageStore';
import { formatBytes, formatNumber, truncatePath } from '@shared/utils/formatters';
import './ScanningView.css';

export const ScanningView: React.FC = () => {
  const { progress, cancelScan, currentScanPath } = useStorageStore();

  const filesCount = progress?.filesScanned || 0;
  const dirsCount = progress?.directoriesScanned || 0;
  const bytesCount = progress?.bytesProcessed || 0;
  const currentItemPath = progress?.currentPath || currentScanPath || 'Starting scan...';

  return (
    <div className="scanning-container">
      <div className="scanning-pulse">
        <FolderSearch size={36} />
      </div>

      <h2 className="scanning-title">Analyzing Storage</h2>
      <p className="scanning-subtitle">
        Building filesystem tree and computing folder sizes...
      </p>

      <div className="scanning-stats-grid">
        <div className="scanning-stat-card">
          <span className="scanning-stat-val">{formatNumber(filesCount)}</span>
          <span className="scanning-stat-lbl">Files</span>
        </div>
        <div className="scanning-stat-card">
          <span className="scanning-stat-val">{formatNumber(dirsCount)}</span>
          <span className="scanning-stat-lbl">Folders</span>
        </div>
        <div className="scanning-stat-card">
          <span className="scanning-stat-val">{formatBytes(bytesCount)}</span>
          <span className="scanning-stat-lbl">Processed</span>
        </div>
      </div>

      <div className="scanning-path-box" title={currentItemPath}>
        {truncatePath(currentItemPath, 70)}
      </div>

      <button
        type="button"
        className="scanning-cancel-btn"
        onClick={cancelScan}
      >
        Cancel Scan
      </button>
    </div>
  );
};
