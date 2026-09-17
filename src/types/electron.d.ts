import type { StorageAPI } from '@shared/types/ipc';

declare global {
  interface Window {
    storageAPI: StorageAPI;
  }
}

export {};
