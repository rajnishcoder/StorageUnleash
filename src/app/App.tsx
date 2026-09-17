import React from 'react';
import { useStorageStore } from '../stores/storageStore';
import { Sidebar } from '../components/layout/Sidebar';
import { HomePage } from '../pages/Home/HomePage';
import { ScanningView } from '../components/scanner/ScanningView';
import { StoragePage } from '../pages/Storage/StoragePage';
import './App.css';

export const App: React.FC = () => {
  const { scanStatus, errorMessage } = useStorageStore();

  return (
    <div className="app-container">
      <header className="app-titlebar">
        <span>StorageUnleash</span>
      </header>
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          {errorMessage && (
            <div style={{
              padding: '10px 16px',
              background: 'rgba(244, 63, 94, 0.15)',
              borderBottom: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fda4af',
              fontSize: '13px'
            }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {scanStatus === 'scanning' && <ScanningView />}
          {scanStatus === 'completed' && <StoragePage />}
          {(scanStatus === 'idle' || scanStatus === 'cancelled' || scanStatus === 'error') && <HomePage />}
        </main>
      </div>
    </div>
  );
};
export default App;
