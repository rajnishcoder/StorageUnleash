import React, { useState, useEffect } from 'react';
import { FolderOpen, HardDrive, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { truncatePath } from '@shared/utils/formatters';
import './HomePage.css';

export const HomePage: React.FC = () => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [platform, setPlatform] = useState<string>('desktop');
  const [isElectron, setIsElectron] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.storageAPI) {
      setIsElectron(true);
      window.storageAPI.getPlatform()
        .then((p) => setPlatform(p))
        .catch((err) => console.error('Failed to get platform:', err));
    }
  }, []);

  const handleSelectFolder = async () => {
    if (!window.storageAPI) {
      alert('Filesystem access requires running within the desktop application.');
      return;
    }

    try {
      setLoading(true);
      const path = await window.storageAPI.selectFolder();
      if (path) {
        setSelectedPath(path);
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDisk = async () => {
    // In V1 initial milestone, select disk opens native picker at root or volumes
    await handleSelectFolder();
  };

  const handleReveal = async () => {
    if (selectedPath && window.storageAPI) {
      try {
        await window.storageAPI.revealInFileManager(selectedPath);
      } catch (error) {
        console.error('Failed to reveal path:', error);
      }
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
          disabled={loading}
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
          onClick={handleSelectDisk}
          disabled={loading}
          type="button"
        >
          <div className="action-icon-wrapper">
            <HardDrive size={28} />
          </div>
          <span className="action-label">Analyze a Disk</span>
          <span className="action-description">Scan entire drive or mount</span>
        </button>
      </div>

      {selectedPath && (
        <div className="selection-info">
          <div className="selection-details">
            <div className="selection-label">Selected Directory</div>
            <div className="selection-path" title={selectedPath}>
              {truncatePath(selectedPath, 60)}
            </div>
          </div>
          <button className="reveal-btn" onClick={handleReveal} type="button">
            <ExternalLink size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            {platform === 'darwin' ? 'Reveal in Finder' : 'Show in Explorer'}
          </button>
        </div>
      )}

      <div className="home-footer">
        <div className="footer-item">
          <ShieldCheck size={14} color="#38bdf8" />
          <span>Local & Private (No cloud upload)</span>
        </div>
        <span>•</span>
        <div className="footer-item">
          <Sparkles size={14} color="#818cf8" />
          <span>{isElectron ? `Secure Preload IPC (${platform})` : 'Web Browser Mode'}</span>
        </div>
      </div>
    </div>
  );
};
