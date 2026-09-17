import { create } from 'zustand';
import type { FileNode, ScanProgress, ScanResult, ScanError } from '@shared/models/fileNode';
import type { QuickTarget, DiskSpaceInfo, TrashInfo } from '@shared/types/ipc';

export type ScanStatus = 'idle' | 'scanning' | 'completed' | 'cancelled' | 'error';
export type ViewMode = 'treemap' | 'list';

export interface StorageState {
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
  viewMode: ViewMode;

  // System & Disk Information
  quickTargets: QuickTarget[];
  diskSpace: DiskSpaceInfo | null;
  trashInfo: TrashInfo | null;
  platform: string;

  // Search & Dev Bloat Filters
  searchQuery: string;
  devFilters: Record<string, boolean>;

  // Actions
  init: () => Promise<void>;
  startScan: (targetPath: string) => Promise<void>;
  cancelScan: () => Promise<void>;
  drillDown: (node: FileNode) => void;
  drillUp: (targetIndex: number) => void;
  selectNode: (node: FileNode | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => void;
  toggleDevFilter: (filterKey: string) => void;
  resetToHome: () => void;
  rescan: () => Promise<void>;
  removePathFromTree: (deletedPath: string) => void;
}

export const useStorageStore = create<StorageState>((set, get) => {
  // Register IPC listeners
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
    viewMode: 'treemap',

    quickTargets: [],
    diskSpace: null,
    trashInfo: null,
    platform: 'desktop',

    searchQuery: '',
    devFilters: {},

    init: async () => {
      if (typeof window !== 'undefined' && window.storageAPI) {
        try {
          const [targets, plat, disk, trash] = await Promise.all([
            window.storageAPI.getQuickTargets(),
            window.storageAPI.getPlatform(),
            window.storageAPI.getDiskSpace(),
            window.storageAPI.getTrashInfo()
          ]);
          set({
            quickTargets: targets,
            platform: plat,
            diskSpace: disk,
            trashInfo: trash
          });
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
        selectedNode: null,
        searchQuery: ''
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

    setViewMode: (mode: ViewMode) => {
      set({ viewMode: mode });
    },

    setSearchQuery: (query: string) => {
      set({ searchQuery: query });
    },

    toggleDevFilter: (filterKey: string) => {
      const { devFilters } = get();
      set({
        devFilters: {
          ...devFilters,
          [filterKey]: !devFilters[filterKey]
        }
      });
    },

    resetToHome: () => {
      set({
        scanStatus: 'idle',
        currentScanPath: null,
        scanResult: null,
        currentDirectory: null,
        breadcrumbs: [],
        selectedNode: null,
        progress: null,
        searchQuery: ''
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
