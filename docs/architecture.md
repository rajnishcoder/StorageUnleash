# StorageUnleash Architecture

## Overview

**StorageUnleash** is a fast, visual desktop storage analyzer for macOS and Windows. It provides intuitive visibility into disk usage through treemap visualizations, drill-down directory navigation, largest-file discovery, and safe cleanup workflows.

## Process Model & Security

The application strictly separates presentation from OS-level operations:

```
┌─────────────────────────────────────────────────────────┐
│                     React Renderer                      │
│        (UI, Treemap, Charts, State, Navigation)        │
└──────────────────────────┬──────────────────────────────┘
                           │
                           │ Controlled API (window.storageAPI)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     Electron Preload                    │
│   (contextBridge.exposeInMainWorld, IPC encapsulation)  │
└──────────────────────────┬──────────────────────────────┘
                           │
                           │ IPC Channels (storage:*)
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Electron Main Process                  │
│  ┌──────────────────┬──────────────────┬─────────────┐  │
│  │ Filesystem       │ Storage          │ Native      │  │
│  │ Scanner          │ Analyzer         │ Trash / OS  │  │
│  └──────────────────┴──────────────────┴─────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Security Invariants
- `contextIsolation: true`: Ensures renderer scripts run in a separate context from Electron internal code and preload scripts.
- `nodeIntegration: false`: Renderer has zero direct Node.js API access (`fs`, `child_process`, `net` are completely unavailable in UI code).
- Strict Preload Expositions: Only specific, validated IPC calls are bridged to `window.storageAPI`.
- Strong Content Security Policy (CSP): Enforces origin safety on scripts and stylesheets.

## Shared Business Logic (`shared/`)

All data structures, formatters, categorization rules, and tree aggregation logic live inside `shared/` without dependencies on Electron or browser DOM APIs. This guarantees future reuse across:
- React + Electron (Desktop)
- React Native (Mobile clients)
- Potential Web / CLI wrappers
