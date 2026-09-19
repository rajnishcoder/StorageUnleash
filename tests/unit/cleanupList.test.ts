import { describe, it, expect, beforeEach } from 'vitest';
import { useStorageStore } from '../../src/stores/storageStore';
import type { FileNode } from '../../shared/models/fileNode';

describe('StorageStore Cleanup List & Batch Actions', () => {
  const dummyFile1: FileNode = {
    id: 'f1',
    name: 'test1.zip',
    path: '/users/test/test1.zip',
    size: 1000,
    type: 'file',
    extension: '.zip'
  };

  const dummyFile2: FileNode = {
    id: 'f2',
    name: 'test2.mp4',
    path: '/users/test/test2.mp4',
    size: 2500,
    type: 'file',
    extension: '.mp4'
  };

  beforeEach(() => {
    useStorageStore.getState().resetToHome();
  });

  it('adds and removes items from cleanup list correctly', () => {
    const store = useStorageStore.getState();
    expect(store.cleanupList.length).toBe(0);

    store.addToCleanupList(dummyFile1);
    expect(useStorageStore.getState().cleanupList.length).toBe(1);
    expect(useStorageStore.getState().cleanupList[0].name).toBe('test1.zip');

    // Does not duplicate same item
    store.addToCleanupList(dummyFile1);
    expect(useStorageStore.getState().cleanupList.length).toBe(1);

    // Adds second item
    store.addToCleanupList(dummyFile2);
    expect(useStorageStore.getState().cleanupList.length).toBe(2);

    // Toggle removes item
    store.toggleCleanupItem(dummyFile1);
    expect(useStorageStore.getState().cleanupList.length).toBe(1);
    expect(useStorageStore.getState().cleanupList[0].name).toBe('test2.mp4');

    // Remove explicitly
    store.removeFromCleanupList(dummyFile2.path);
    expect(useStorageStore.getState().cleanupList.length).toBe(0);
  });

  it('prunes multiple paths from tree structure', () => {
    const rootNode: FileNode = {
      id: 'root',
      name: 'root',
      path: '/users/test',
      size: 3500,
      type: 'directory',
      fileCount: 2,
      children: [dummyFile1, dummyFile2]
    };

    useStorageStore.setState({
      scanResult: {
        root: rootNode,
        totalSize: 3500,
        totalFiles: 2,
        totalDirectories: 1,
        durationMs: 50,
        errors: []
      },
      cleanupList: [dummyFile1, dummyFile2]
    });

    useStorageStore.getState().removePathsFromTree(['/users/test/test1.zip']);

    const updated = useStorageStore.getState();
    expect(updated.scanResult?.root.children?.length).toBe(1);
    expect(updated.scanResult?.root.children?.[0].name).toBe('test2.mp4');
    expect(updated.scanResult?.totalSize).toBe(2500);
    expect(updated.cleanupList.length).toBe(1);
    expect(updated.cleanupList[0].name).toBe('test2.mp4');
  });
});
