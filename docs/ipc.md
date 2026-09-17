# IPC Design & Specification

## Principles
1. **Explicit Whitelist**: Never expose generic execution bridges (e.g. `window.fs.exec()`).
2. **Strict Typing**: All channel payloads, arguments, and return types are strongly typed in `shared/types/ipc.ts`.
3. **Event Subscriptions**: Asynchronous streams (e.g. scan progress updates) return unsubscribe cleanup closures.

## Channels Overview

| Channel | Direction | Payload | Return / Description |
| :--- | :--- | :--- | :--- |
| `storage:select-folder` | Renderer -> Main | `void` | `Promise<string \| null>`: Native folder selector |
| `storage:start-scan` | Renderer -> Main | `path: string` | `Promise<void>`: Initiates background recursive scan |
| `storage:cancel-scan` | Renderer -> Main | `void` | `Promise<void>`: Gracefully stops running scan |
| `storage:scan-progress` | Main -> Renderer | `ScanProgress` | Emitted periodically during scan |
| `storage:scan-complete` | Main -> Renderer | `ScanResult` | Emitted when root tree analysis completes |
| `storage:scan-error` | Main -> Renderer | `ScanError` | Emitted on non-fatal scan errors |
| `storage:reveal-in-file-manager` | Renderer -> Main | `path: string` | `Promise<void>`: Opens item in Finder / File Explorer |
| `storage:move-to-trash` | Renderer -> Main | `paths: string[]` | `Promise<TrashResult>`: Moves items to OS Trash/Recycle Bin |
| `storage:get-platform` | Renderer -> Main | `void` | `Promise<string>`: Returns `darwin` \| `win32` \| `linux` |

## Preload Bridge (`StorageAPI`)

```typescript
interface StorageAPI {
  selectFolder(): Promise<string | null>;
  startScan(path: string): Promise<void>;
  cancelScan(): Promise<void>;
  revealInFileManager(path: string): Promise<void>;
  moveToTrash(paths: string[]): Promise<TrashResult>;
  getPlatform(): Promise<string>;
  onScanProgress(callback: (progress: ScanProgress) => void): () => void;
  onScanComplete(callback: (result: ScanResult) => void): () => void;
  onScanError(callback: (error: ScanError) => void): () => void;
}
```
