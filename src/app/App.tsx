import React from 'react';
import { HomePage } from '../pages/Home/HomePage';
import './App.css';

export const App: React.FC = () => {
  return (
    <div className="app-container">
      <header className="app-titlebar">
        <span>StorageUnleash</span>
      </header>
      <main className="app-main">
        <HomePage />
      </main>
    </div>
  );
};
export default App;
