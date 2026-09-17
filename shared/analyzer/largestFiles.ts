import type { FileNode } from '../models/fileNode';

/**
 * Finds the top N largest individual files within a FileNode hierarchy.
 */
export function findLargestFiles(root: FileNode, limit: number = 100): FileNode[] {
  const files: FileNode[] = [];

  function collect(node: FileNode) {
    if (node.type === 'file' && node.size > 0) {
      files.push(node);
    } else if (node.children) {
      for (const child of node.children) {
        collect(child);
      }
    }
  }

  collect(root);

  return files
    .sort((a, b) => b.size - a.size)
    .slice(0, limit);
}
