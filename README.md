# StorageUnleash 🚀

[![Website](https://img.shields.io/badge/Website-storageunleashed.com-0284c7?style=flat-square&logo=globe)](https://www.storageunleashed.com)
[![GitHub Sponsor](https://img.shields.io/badge/Sponsor-%E2%9D%A4-ea4aaa?style=flat-square&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/rajnishcoder)
[![Platform](https://img.shields.io/badge/Platform-macOS-171717?style=flat-square&logo=apple&logoColor=white)](https://www.storageunleashed.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

🌐 **Official Website**: [https://www.storageunleashed.com](https://www.storageunleashed.com)

A fast, modern, visual desktop storage analyzer crafted specifically for **macOS** (Apple Silicon & Intel). Understand, explore, and reclaim what is consuming storage on your Mac through intuitive treemaps, radial sunburst charts, and 1-click cleanup workflows.

---

## ✨ Key Features

- **⚡ Blazing Fast Asynchronous Scanner**: Concurrent filesystem traversal without freezing the UI.
- **🗺️ Interactive Treemap & Sunburst Views**: Spot disk hogs instantly by category (Videos, Developer Caches, Disk Images, Archives, Photos, Audio).
- **🧹 Safe Batch Cleanup**: Review items in a queue before moving them safely to macOS Trash.
- **🔒 100% Local & Private**: No analytics, no accounts, zero telemetry, and complete offline capability.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Modern React Hooks, Vanilla CSS / CSS Variables.
- **Desktop**: Electron 35 with strict security (`contextIsolation: true`, `nodeIntegration: false`, preload bridge).
- **State Management**: Zustand.
- **Testing**: Vitest.
- **Core Architecture**: Decoupled `shared/` core ready for desktop and future clients.

---

## 🚀 Getting Started

### Prerequisites
- macOS 12 (Monterey) through macOS 15+ (Sequoia)
- Node.js >= 18 (Node 22 or 24 recommended)
- npm >= 9

### Installation

```bash
npm install
```

### Development Mode

Runs Vite development server and launches the Electron application with Hot Module Replacement (HMR):

```bash
npm run dev
```

### Type Checking & Tests

```bash
# Typecheck TypeScript codebase
npm run typecheck

# Run Vitest test suite
npm run test
```

### Packaging & macOS DMG Build

```bash
# Build production bundle and package macOS DMG installer (Apple Silicon & Intel)
npm run dist

# Or package exclusively for Apple Silicon (M1/M2/M3/M4)
npm run dist:arm64
```

---

## 📂 Project Structure

```
StorageUnleash/
├── src/                      # React Renderer process
│   ├── app/                  # Root application components and global styling
│   ├── components/           # UI components (common, layout, storage, visualization)
│   ├── pages/                # Page views (Home, Scan, Storage)
│   ├── types/                # Renderer ambient types (electron.d.ts)
│   └── main.tsx              # React mounting entry point
│
├── electron/                 # Electron Main Process & Preload
│   ├── main.ts               # Main process entry, BrowserWindow creation
│   ├── preload.ts            # Secure contextBridge API exposer
│   ├── ipc/                  # Typed IPC handler implementations
│   ├── filesystem/           # Native filesystem scanning & operations
│   └── platform/             # macOS native integrations
│
├── shared/                   # Decoupled TypeScript business logic
│   ├── models/               # FileNode, ScanProgress, ScanResult data models
│   ├── types/                # Typed IPC contracts (StorageAPI)
│   └── utils/                # Formatters, calculations, categorizers
│
├── tests/                    # Vitest unit test suites
│   └── unit/                 # Unit tests for shared logic
│
└── docs/                     # Architecture & design documents
```

---

## 🔒 Security Model

- **Context Isolation**: Enabled (`contextIsolation: true`).
- **Node Integration**: Disabled in renderer (`nodeIntegration: false`).
- **Controlled Preload Bridge**: Renderer interacts only via explicit, typed `window.storageAPI` methods.
- **Privacy First**: Completely local; zero network analytics or telemetry.

---

## 💖 Support & Sponsoring

StorageUnleash is 100% free, privacy-first, and open-source software. If you find it useful for analyzing disk space and keeping your Mac clean, consider supporting its continuous maintenance and feature development:

- 💖 **GitHub Sponsors**: [github.com/sponsors/rajnishcoder](https://github.com/sponsors/rajnishcoder)
- ☕ **Buy Me a Coffee**: [buymeacoffee.com/rajnishcoder](https://buymeacoffee.com/rajnishcoder)

Every contribution helps keep the project actively maintained and free for everyone!


