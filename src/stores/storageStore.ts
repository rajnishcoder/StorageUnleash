import { create } from 'zustand';
import type { FileNode, ScanProgress, ScanResult, ScanError } from '@shared/models/fileNode';
import type { QuickTarget } from '@shared/types/ipc';

export type ScanStatus = 'idle' | 'scanning' | 'completed' | 'cancelled' | 'error';
export type ViewTab = 'treemap' | 'largest-files' | 'file-types';

interface StorageState {
  // Navigation & Scan State
  scanStatus: ScanStatus;
  currentScanPath: string | null;
  progress: ScanProgress | null;
  scanResult: ScanResult | null;
  errorMessage: string | null;

  // Treemap & Exploration State
  currentDirectory: FileNode | null;
  breadcrumbs: FileNode[];
  selectedNode: FileNode | null;
  activeTab: ViewTab;

  // Quick Targets & OS
  quickTargets: QuickTarget[];
  platform: string;

  // Actions
  init: () => Promise<void>;
  startScan: (targetPath: string) => Promise<void>;
  cancelScan: () => Promise<void>;
  drillDown: (node: FileNode) => void;
  drillUp: (targetIndex: number) => void;
  selectNode: (node: FileNode | null) => void;
  setActiveTab: (tab: ViewTab) => void;
  resetToHome: () => void;
  rescan: () => Promise<void>;
  removePathFromTree: (deletedPath: string) => void;
}

export const useStorageStore = create<StorageState>((set, get) => {
  // Register IPC listeners if window.storageAPI is present
  if (typeof window !== 'undefined' && window.storageAPI) {
    window.storageAPI.onScanProgress((progress) => {
      set({ progress });
    });

    window.storageAPI.onScanComplete((scanResult) => {
      set({
        scanStatus: 'completed',
        scanResult,
        currentDirectory: scanResult.root,
        breadcrumbs: [scanResult.root],
        selectedNode: null
      });
    });

    window.storageAPI.onScanError((error: ScanError) => {
      set({
        scanStatus: 'error',
        errorMessage: error.message
      });
    });
  }

  return {
    scanStatus: 'idle',
    currentScanPath: null,
    progress: null,
    scanResult: null,
    errorMessage: null,

    currentDirectory: null,
    breadcrumbs: [],
    selectedNode: null,
    activeTab: 'treemap',

    quickTargets: [],
    platform: 'desktop',

    init: async () => {
      if (typeof window !== 'undefined' && window.storageAPI) {
        try {
          const [targets, plat] = await Promise.all([
            window.storageAPI.getQuickTargets(),
            window.storageAPI.getPlatform()
          ]);
          set({ quickTargets: targets, platform: plat });
        } catch (error) {
          console.error('Failed to init storage store:', error);
        }
      }
    },

    startScan: async (targetPath: string) => {
      if (!targetPath) return;

      set({
        scanStatus: 'scanning',
        currentScanPath: targetPath,
        progress: {
          filesScanned: 0,
          directoriesScanned: 0,
          bytesProcessed: 0,
          currentPath: targetPath
        },
        errorMessage: null,
        selectedNode: null
      });

      if (typeof window !== 'undefined' && window.storageAPI) {
        try {
          await window.storageAPI.startScan(targetPath);
        } catch (error: any) {
          set({
            scanStatus: 'error',
            errorMessage: error?.message || 'Failed to scan directory'
          });
        }
      }
    },

    cancelScan: async () => {
      if (typeof window !== 'undefined' && window.storageAPI) {
        try {
          await window.storageAPI.cancelScan();
        } catch (err) {
          console.error('Failed to cancel scan:', err);
        }
      }
      set({ scanStatus: 'cancelled' });
    },

    drillDown: (node: FileNode) => {
      if (node.type !== 'directory') return;
      const { breadcrumbs } = get();
      set({
        currentDirectory: node,
        breadcrumbs: [...breadcrumbs, node],
        selectedNode: null
      });
    },

    drillUp: (targetIndex: number) => {
      const { breadcrumbs } = get();
      if (targetIndex >= 0 && targetIndex < breadcrumbs.length) {
        const nextBreadcrumbs = breadcrumbs.slice(0, targetIndex + 1);
        set({
          currentDirectory: nextBreadcrumbs[nextBreadcrumbs.length - 1],
          breadcrumbs: nextBreadcrumbs,
          selectedNode: null
        });
      }
    },

    selectNode: (node: FileNode | null) => {
      set({ selectedNode: node });
    },

    setActiveTab: (tab: ViewTab) => {
      set({ activeTab: tab });
    },

    resetToHome: () => {
      set({
        scanStatus: 'idle',
        currentScanPath: null,
        scanResult: null,
        currentDirectory: null,
        breadcrumbs: [],
        selectedNode: null,
        progress: null
      });
    },

    rescan: async () => {
      const { currentScanPath, startScan } = get();
      if (currentScanPath) {
        await startScan(currentScanPath);
      }
    },

    removePathFromTree: (deletedPath: string) => {
      const { scanResult, currentDirectory } = get();
      if (!scanResult) return;

      function prune(node: FileNode): FileNode | null {
        if (node.path === deletedPath) return null;
        if (node.children) {
          const newChildren: FileNode[] = [];
          let freedSize = 0;
          let freedFiles = 0;

          for (const child of node.children) {
            const prunedChild = prune(child);
            if (prunedChild) {
              newChildren.push(prunedChild);
            } else {
              freedSize += child.size;
              freedFiles += (child.fileCount || (child.type === 'file' ? 1 : 0));
            }
          }

          node.children = newChildren;
          node.size = Math.max(0, node.size - freedSize);
          if (node.fileCount) {
            node.fileCount = Math.max(0, node.fileCount - freedFiles);
          }
        }
        return node;
      }

      prune(scanResult.root);

      set({
        scanResult: { ...scanResult, root: scanResult.root, totalSize: scanResult.root.size },
        currentDirectory: currentDirectory ? { ...currentDirectory } : null,
        selectedNode: null
      });
    }
  };
});
