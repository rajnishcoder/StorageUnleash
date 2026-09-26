import { create } from 'zustand';
import type { FileNode, ScanProgress, ScanResult, ScanError } from '@shared/models/fileNode';
import type { QuickTarget, DiskSpaceInfo, TrashInfo, AppUpdateInfo } from '@shared/types/ipc';

export type ScanStatus = 'idle' | 'scanning' | 'preparing' | 'completed' | 'cancelled' | 'error';
export type ViewMode = 'treemap' | 'sunburst' | 'list';

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

  // App Update State
  updateInfo: AppUpdateInfo | null;
  isCheckingUpdate: boolean;
  isUpdateDismissed: boolean;
  isUpdateModalOpen: boolean;

  // Search & Dev Bloat Filters
  searchQuery: string;
  devFilters: Record<string, boolean>;

  // Cleanup List (Review & Batch Action Queue)
  cleanupList: FileNode[];

  // Pending Disk Changes (Items deleted, size updated in memory)
  hasPendingDiskChanges: boolean;

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
  addToCleanupList: (node: FileNode) => void;
  removeFromCleanupList: (path: string) => void;
  toggleCleanupItem: (node: FileNode) => void;
  clearCleanupList: () => void;
  resetToHome: () => void;
  rescan: () => Promise<void>;
  removePathFromTree: (deletedPath: string) => void;
  removePathsFromTree: (deletedPaths: string[]) => void;
  refreshTrashInfo: () => Promise<void>;
  emptyTrash: () => Promise<boolean>;
  openTrash: () => Promise<void>;
  checkForUpdates: (manual?: boolean) => Promise<AppUpdateInfo | null>;
  setIsUpdateModalOpen: (open: boolean) => void;
  dismissUpdate: () => void;
}

export const useStorageStore = create<StorageState>((set, get) => {
  // Register IPC listeners
  if (typeof window !== 'undefined' && window.storageAPI) {
    window.storageAPI.onScanProgress((progress) => {
      set({ progress });
    });

    window.storageAPI.onScanComplete((scanResult) => {
      set({
        scanStatus: 'preparing',
        scanResult,
        currentDirectory: scanResult.root,
        breadcrumbs: [scanResult.root],
        selectedNode: null,
        hasPendingDiskChanges: false
      });

      // Smooth transition giving time for UI to prepare and render treemap
      setTimeout(() => {
        set({ scanStatus: 'completed' });
      }, 300);
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

    updateInfo: null,
    isCheckingUpdate: false,
    isUpdateDismissed: false,
    isUpdateModalOpen: false,

    searchQuery: '',
    devFilters: {},
    cleanupList: [],
    hasPendingDiskChanges: false,

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

          // Check for updates in background after startup
          setTimeout(() => {
            get().checkForUpdates(false);
          }, 1200);
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
        searchQuery: '',
        cleanupList: [],
        hasPendingDiskChanges: false
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

    addToCleanupList: (node: FileNode) => {
      const { cleanupList } = get();
      if (!cleanupList.some((item) => item.path === node.path)) {
        set({ cleanupList: [...cleanupList, node] });
      }
    },

    removeFromCleanupList: (path: string) => {
      const { cleanupList } = get();
      set({ cleanupList: cleanupList.filter((item) => item.path !== path) });
    },

    toggleCleanupItem: (node: FileNode) => {
      const { cleanupList } = get();
      const exists = cleanupList.some((item) => item.path === node.path);
      if (exists) {
        set({ cleanupList: cleanupList.filter((item) => item.path !== node.path) });
      } else {
        set({ cleanupList: [...cleanupList, node] });
      }
    },

    clearCleanupList: () => {
      set({ cleanupList: [] });
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
        searchQuery: '',
        cleanupList: [],
        hasPendingDiskChanges: false
      });
    },

    rescan: async () => {
      const { currentScanPath, startScan } = get();
      if (currentScanPath) {
        await startScan(currentScanPath);
      }
    },

    removePathFromTree: (deletedPath: string) => {
      const { scanResult, currentDirectory, breadcrumbs, cleanupList } = get();
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

      function findNodeInTree(root: FileNode, targetPath: string): FileNode | null {
        if (root.path === targetPath) return root;
        if (!root.children || root.children.length === 0) return null;
        for (const child of root.children) {
          if (child.path === targetPath) return child;
          if (child.type === 'directory') {
            const found = findNodeInTree(child, targetPath);
            if (found) return found;
          }
        }
        return null;
      }

      prune(scanResult.root);

      const updatedRoot = { ...scanResult.root };
      const updatedCurrentDir = currentDirectory
        ? findNodeInTree(updatedRoot, currentDirectory.path) || updatedRoot
        : updatedRoot;

      const updatedBreadcrumbs = breadcrumbs.map((b) =>
        findNodeInTree(updatedRoot, b.path) || b
      );

      set({
        scanResult: { ...scanResult, root: updatedRoot, totalSize: updatedRoot.size },
        currentDirectory: { ...updatedCurrentDir },
        breadcrumbs: updatedBreadcrumbs.length > 0 ? updatedBreadcrumbs : [updatedRoot],
        selectedNode: null,
        cleanupList: cleanupList.filter((item) => item.path !== deletedPath),
        hasPendingDiskChanges: true
      });

      // Update live trash stats and disk space
      get().refreshTrashInfo();
      if (typeof window !== 'undefined' && window.storageAPI) {
        window.storageAPI.getDiskSpace().then((disk) => set({ diskSpace: disk })).catch(() => {});
      }
    },

    removePathsFromTree: (deletedPaths: string[]) => {
      const { scanResult, currentDirectory, breadcrumbs, cleanupList } = get();
      if (!scanResult || deletedPaths.length === 0) return;

      const pathSet = new Set(deletedPaths);

      function prune(node: FileNode): FileNode | null {
        if (pathSet.has(node.path)) return null;
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

      function findNodeInTree(root: FileNode, targetPath: string): FileNode | null {
        if (root.path === targetPath) return root;
        if (!root.children || root.children.length === 0) return null;
        for (const child of root.children) {
          if (child.path === targetPath) return child;
          if (child.type === 'directory') {
            const found = findNodeInTree(child, targetPath);
            if (found) return found;
          }
        }
        return null;
      }

      prune(scanResult.root);

      const updatedRoot = { ...scanResult.root };
      const updatedCurrentDir = currentDirectory
        ? findNodeInTree(updatedRoot, currentDirectory.path) || updatedRoot
        : updatedRoot;

      const updatedBreadcrumbs = breadcrumbs.map((b) =>
        findNodeInTree(updatedRoot, b.path) || b
      );

      set({
        scanResult: { ...scanResult, root: updatedRoot, totalSize: updatedRoot.size },
        currentDirectory: { ...updatedCurrentDir },
        breadcrumbs: updatedBreadcrumbs.length > 0 ? updatedBreadcrumbs : [updatedRoot],
        selectedNode: null,
        cleanupList: cleanupList.filter((item) => !pathSet.has(item.path)),
        hasPendingDiskChanges: true
      });

      // Update live trash stats and disk space
      get().refreshTrashInfo();
      if (typeof window !== 'undefined' && window.storageAPI) {
        window.storageAPI.getDiskSpace().then((disk) => set({ diskSpace: disk })).catch(() => {});
      }
    },

    refreshTrashInfo: async () => {
      if (typeof window !== 'undefined' && window.storageAPI) {
        try {
          const trash = await window.storageAPI.getTrashInfo();
          set({ trashInfo: trash });
        } catch (err) {
          console.error('Failed to refresh trash info:', err);
        }
      }
    },

    emptyTrash: async () => {
      if (typeof window !== 'undefined' && window.storageAPI) {
        try {
          const success = await window.storageAPI.emptyTrash();
          if (success) {
            const [trash, disk] = await Promise.all([
              window.storageAPI.getTrashInfo(),
              window.storageAPI.getDiskSpace()
            ]);
            set({ trashInfo: trash, diskSpace: disk });
            return true;
          }
        } catch (err) {
          console.error('Failed to empty trash:', err);
        }
      }
      return false;
    },

    openTrash: async () => {
      if (typeof window !== 'undefined' && window.storageAPI) {
        try {
          await window.storageAPI.openTrash();
        } catch (err) {
          console.error('Failed to open trash:', err);
        }
      }
    },

    checkForUpdates: async (manual = false) => {
      if (typeof window !== 'undefined' && window.storageAPI?.checkForUpdates) {
        set({ isCheckingUpdate: true });
        try {
          const info = await window.storageAPI.checkForUpdates();
          set({
            updateInfo: info,
            isCheckingUpdate: false,
            isUpdateModalOpen: manual || (info.hasUpdate && !get().isUpdateDismissed)
          });
          return info;
        } catch (err) {
          console.error('Failed to check for updates:', err);
          set({ isCheckingUpdate: false });
        }
      }
      return null;
    },

    setIsUpdateModalOpen: (open: boolean) => {
      set({ isUpdateModalOpen: open });
    },

    dismissUpdate: () => {
      set({ isUpdateDismissed: true, isUpdateModalOpen: false });
    }
  };
});
