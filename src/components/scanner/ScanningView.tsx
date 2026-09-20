import React from 'react';
import { FolderSearch } from 'lucide-react';
import { useStorageStore } from '../../stores/storageStore';
import { formatBytes, formatNumber, truncatePath } from '@shared/utils/formatters';
import './ScanningView.css';

export const ScanningView: React.FC = () => {
  const { progress, cancelScan, currentScanPath, scanStatus } = useStorageStore();

  const filesCount = progress?.filesScanned || 0;
  const dirsCount = progress?.directoriesScanned || 0;
  const bytesCount = progress?.bytesProcessed || 0;
  const currentItemPath = progress?.currentPath || currentScanPath || 'Starting scan...';

  const isFinalizing =
    scanStatus === 'preparing' ||
    progress?.percentage === 100 ||
    currentItemPath.includes('Finalizing') ||
    currentItemPath === 'Scan completed';

  return (
    <div className="scanning-container">
      <div className={`scanning-pulse ${isFinalizing ? 'finalizing' : ''}`}>
        {isFinalizing ? (
          <div className="scanning-spinner" />
        ) : (
          <FolderSearch size={36} />
        )}
      </div>

      <h2 className="scanning-title">
        {isFinalizing ? 'Generating Treemap' : 'Analyzing Storage'}
      </h2>
      <p className="scanning-subtitle">
        {isFinalizing
          ? 'Calculating folder hierarchies & rendering interactive treemap...'
          : 'Building filesystem tree and computing folder sizes...'}
      </p>

      {/* Shimmering Progress Bar when Finalizing */}
      {isFinalizing && (
        <div className="scanning-progress-bar-wrap">
          <div className="scanning-progress-bar-fill" />
        </div>
      )}

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
        {isFinalizing ? 'Finalizing storage map and rendering...' : truncatePath(currentItemPath, 70)}
      </div>

      {!isFinalizing && (
        <button
          type="button"
          className="scanning-cancel-btn"
          onClick={cancelScan}
        >
          Cancel Scan
        </button>
      )}
    </div>
  );
};
