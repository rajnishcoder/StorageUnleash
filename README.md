# StorageUnleash 🚀

A fast, modern, visual desktop storage analyzer for **macOS** and **Windows**. Understand and explore what is consuming storage on your computer through intuitive treemaps and interactive drill-downs.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Modern React Hooks, Vanilla CSS / CSS Variables.
- **Desktop**: Electron 35 with strict security (`contextIsolation: true`, `nodeIntegration: false`, preload bridge).
- **State Management**: Zustand.
- **Testing**: Vitest.
- **Core Architecture**: Decoupled `shared/` core ready for desktop and future React Native clients.

---

## 🚀 Getting Started

### Prerequisites
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

### Production Build

```bash
npm run build
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
│   └── platform/             # macOS & Windows native integrations
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
    ├── architecture.md       # Overall architecture & security model
    ├── filesystem-scanner.md # Scanner design & performance strategies
    ├── ipc.md                # IPC channel specifications
    └── platform-notes.md     # macOS and Windows considerations
```

---

## 🔒 Security Model

- **Context Isolation**: Enabled (`contextIsolation: true`).
- **Node Integration**: Disabled in renderer (`nodeIntegration: false`).
- **Controlled Preload Bridge**: Renderer interacts only via explicit, typed `window.storageAPI` methods.
- **Privacy First**: Completely local; zero network analytics or telemetry.
