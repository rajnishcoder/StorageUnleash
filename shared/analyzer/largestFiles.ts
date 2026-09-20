import type { FileNode } from '../models/fileNode';

/**
 * Finds the top N largest individual files within a FileNode hierarchy using a bounded top-K collection.
 */
export function findLargestFiles(root: FileNode, limit: number = 100): FileNode[] {
  if (!root) return [];
  const topFiles: FileNode[] = [];
  let minSizeInTop = 0;

  function collect(node: FileNode) {
    if (node.type === 'file' && node.size > 0) {
      if (topFiles.length < limit) {
        topFiles.push(node);
        if (topFiles.length === limit) {
          topFiles.sort((a, b) => b.size - a.size);
          minSizeInTop = topFiles[limit - 1].size;
        }
      } else if (node.size > minSizeInTop) {
        // Binary search insertion index
        let low = 0;
        let high = topFiles.length - 1;
        while (low <= high) {
          const mid = (low + high) >>> 1;
          if (topFiles[mid].size > node.size) {
            low = mid + 1;
          } else {
            high = mid - 1;
          }
        }
        topFiles.splice(low, 0, node);
        topFiles.pop();
        minSizeInTop = topFiles[limit - 1].size;
      }
    } else if (node.children) {
      for (let i = 0; i < node.children.length; i++) {
        collect(node.children[i]);
      }
    }
  }

  collect(root);
  if (topFiles.length < limit) {
    topFiles.sort((a, b) => b.size - a.size);
  }

  return topFiles;
}
