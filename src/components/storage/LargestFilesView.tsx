import React, { useState, useMemo } from 'react';
import { useStorageStore } from '../../stores/storageStore';
import { findLargestFiles } from '@shared/analyzer/largestFiles';
import { categorizeFile, CATEGORY_COLORS, CATEGORY_LABELS } from '@shared/analyzer/categorizer';
import { formatBytes, truncatePath } from '@shared/utils/formatters';
import { File, ExternalLink, Trash2, Search } from 'lucide-react';
import type { FileNode } from '@shared/models/fileNode';
import './LargestFilesView.css';

interface LargestFilesViewProps {
  onTrashRequest: (node: FileNode) => void;
}

export const LargestFilesView: React.FC<LargestFilesViewProps> = ({ onTrashRequest }) => {
  const { scanResult, platform } = useStorageStore();
  const [searchQuery, setSearchQuery] = useState('');

  const largestFiles = useMemo(() => {
    if (!scanResult) return [];
    return findLargestFiles(scanResult.root, 150);
  }, [scanResult]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return largestFiles;
    const q = searchQuery.toLowerCase();
    return largestFiles.filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q));
  }, [largestFiles, searchQuery]);

  const handleReveal = async (path: string) => {
    if (window.storageAPI) {
      try {
        await window.storageAPI.revealInFileManager(path);
      } catch (err) {
        console.error('Failed to reveal file:', err);
      }
    }
  };

  return (
    <div className="largest-files-container">
      <div className="largest-files-header">
        <span className="largest-files-title">Top Largest Files ({filteredFiles.length})</span>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="largest-files-search"
            style={{ paddingLeft: '30px' }}
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="largest-files-table-wrapper">
        <table className="largest-files-table">
          <thead>
            <tr>
              <th style={{ width: '45px' }}>#</th>
              <th>Name & Path</th>
              <th style={{ width: '110px' }}>Category</th>
              <th style={{ width: '120px' }}>Size</th>
              <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.map((file, idx) => {
              const category = categorizeFile(file.extension || file.name);
              const color = CATEGORY_COLORS[category];

              return (
                <tr key={file.id || file.path || idx} className="largest-files-row">
                  <td>{idx + 1}</td>
                  <td>
                    <div className="file-name-cell">
                      <File size={15} color={color} />
                      <span>{file.name}</span>
                    </div>
                    <div className="file-path-subtext" title={file.path}>
                      {truncatePath(file.path, 65)}
                    </div>
                  </td>
                  <td>
                    <span style={{ color, fontSize: '12px', fontWeight: 500 }}>
                      {CATEGORY_LABELS[category]}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {formatBytes(file.size)}
                  </td>
                  <td>
                    <div className="file-actions-cell">
                      <button
                        type="button"
                        className="table-btn"
                        onClick={() => handleReveal(file.path)}
                        title={platform === 'darwin' ? 'Reveal in Finder' : 'Show in Explorer'}
                      >
                        <ExternalLink size={12} />
                      </button>
                      <button
                        type="button"
                        className="table-btn trash-btn"
                        onClick={() => onTrashRequest(file)}
                        title="Move to Trash"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
