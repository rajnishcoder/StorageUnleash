import React, { useState } from 'react';
import { Search, PieChart, Heart, Rocket } from 'lucide-react';
import { useStorageStore } from '../../stores/storageStore';
import { SupportModal } from '../common/SupportModal';
import './TopNav.css';

export const TopNav: React.FC = () => {
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    platform,
    updateInfo,
    isUpdateDismissed,
    setIsUpdateModalOpen
  } = useStorageStore();

  return (
    <header className="top-nav">
      <div className="top-nav-left">
        {platform === 'darwin' && <div className="mac-traffic-lights-spacer" />}
        <div className="top-nav-brand">
          <PieChart size={17} color="#38bdf8" />
          <span>StorageUnleash</span>
        </div>
      </div>

      <div className="top-nav-center">
        <div className="search-input-wrapper">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-shortcut">⌘F</span>
        </div>
      </div>

      <div className="top-nav-right">
        {updateInfo?.hasUpdate && !isUpdateDismissed && (
          <button
            type="button"
            className="top-nav-update-btn"
            onClick={() => setIsUpdateModalOpen(true)}
            title={`Storage Unleashed v${updateInfo.latestVersion} is available! Click to update.`}
          >
            <Rocket size={12} className="rocket-icon-nav" />
            <span>v{updateInfo.latestVersion} Update</span>
          </button>
        )}

        <button
          type="button"
          className="top-nav-support-btn"
          onClick={() => setIsSupportOpen(true)}
          title="Support Storage Unleashed"
        >
          <Heart size={13} className="heart-icon-nav" />
          <span>Support</span>
        </button>

        <div className="nav-view-pills">
          <button
            type="button"
            className={`nav-view-btn ${viewMode === 'treemap' ? 'active' : ''}`}
            onClick={() => setViewMode('treemap')}
          >
            Treemap
          </button>
          <button
            type="button"
            className={`nav-view-btn ${viewMode === 'sunburst' ? 'active' : ''}`}
            onClick={() => setViewMode('sunburst')}
          >
            Sunburst
          </button>
          <button
            type="button"
            className={`nav-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            List View
          </button>
        </div>
      </div>

      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
      />
    </header>
  );
};
