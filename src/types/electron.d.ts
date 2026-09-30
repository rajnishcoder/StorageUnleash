import type { StorageAPI } from '@shared/types/ipc';

declare global {
  interface Window {
    storageAPI: StorageAPI;
  }
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

export {};

