import React, { useMemo } from 'react';
import { useStorageStore } from '../../stores/storageStore';
import { aggregateCategories } from '@shared/analyzer/categorizer';
import { formatBytes, formatNumber } from '@shared/utils/formatters';
import './FileTypesView.css';

export const FileTypesView: React.FC = () => {
  const { scanResult } = useStorageStore();

  const categories = useMemo(() => {
    if (!scanResult) return [];
    return aggregateCategories(scanResult.root);
  }, [scanResult]);

  const totalSize = scanResult?.totalSize || 1;

  return (
    <div className="file-types-container">
      <div className="file-types-bar-wrapper">
        <div className="file-types-bar-title">Storage Breakdown by Category</div>
        <div className="file-types-multi-bar">
          {categories.map((cat) => {
            const pct = (cat.size / totalSize) * 100;
            if (pct < 0.2) return null;
            return (
              <div
                key={cat.category}
                className="multi-bar-segment"
                style={{
                  width: `${pct}%`,
                  backgroundColor: cat.color
                }}
                title={`${cat.label}: ${formatBytes(cat.size)} (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>
      </div>

      <div className="file-types-grid">
        {categories.map((cat) => {
          const pct = ((cat.size / totalSize) * 100).toFixed(1);
          return (
            <div key={cat.category} className="file-type-card">
              <div className="file-type-header">
                <div className="file-type-name">
                  <span className="file-type-dot" style={{ backgroundColor: cat.color }} />
                  <span>{cat.label}</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{pct}%</span>
              </div>
              <div className="file-type-size">{formatBytes(cat.size)}</div>
              <div className="file-type-count">{formatNumber(cat.fileCount)} files</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
