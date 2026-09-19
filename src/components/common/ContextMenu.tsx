import React, { useEffect, useRef } from 'react';
import { ArrowRight, Trash2, Layers, Check } from 'lucide-react';
import type { FileNode } from '@shared/models/fileNode';
import './ContextMenu.css';

export interface ContextMenuProps {
  node: FileNode;
  x: number;
  y: number;
  onClose: () => void;
  onReveal: (node: FileNode) => void;
  onTrash: (node: FileNode) => void;
  onToggleCleanup: (node: FileNode) => void;
  isInCleanup?: boolean;
  platform: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  node,
  x,
  y,
  onClose,
  onReveal,
  onTrash,
  onToggleCleanup,
  isInCleanup = false,
  platform
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click, window blur, resize, or escape key
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent | MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [onClose]);

  // Clamp positioning inside the viewport
  const menuWidth = 220;
  const menuHeight = 150;
  const padding = 8;

  const posX = Math.min(
    Math.max(padding, x),
    (typeof window !== 'undefined' ? window.innerWidth : 1000) - menuWidth - padding
  );
  const posY = Math.min(
    Math.max(padding, y),
    (typeof window !== 'undefined' ? window.innerHeight : 800) - menuHeight - padding
  );

  const revealLabel = platform === 'darwin' ? 'Reveal in Finder' : platform === 'win32' ? 'Show in Explorer' : 'Show in File Manager';

  return (
    <div
      ref={menuRef}
      className="custom-context-menu"
      style={{ left: `${posX}px`, top: `${posY}px` }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="context-menu-header" title={node.path || node.name}>
        {node.name}
      </div>

      <div className="context-menu-items">
        <button
          type="button"
          className="context-menu-item"
          onClick={() => {
            onReveal(node);
            onClose();
          }}
        >
          <div className="item-icon-left">
            <ArrowRight size={14} color="#94a3b8" />
          </div>
          <span className="item-label">{revealLabel}</span>
        </button>

        <button
          type="button"
          className="context-menu-item trash-item"
          onClick={() => {
            onTrash(node);
            onClose();
          }}
        >
          <div className="item-icon-left">
            <Trash2 size={14} color="#ef4444" />
          </div>
          <span className="item-label">Move to Trash</span>
        </button>

        <button
          type="button"
          className={`context-menu-item cleanup-item ${isInCleanup ? 'in-cleanup' : ''}`}
          onClick={() => {
            onToggleCleanup(node);
            onClose();
          }}
        >
          <div className="item-icon-left">
            {isInCleanup ? (
              <Check size={14} color="#10b981" />
            ) : (
              <Layers size={14} color="#f59e0b" />
            )}
          </div>
          <span className="item-label">
            {isInCleanup ? 'Remove from Cleanup' : 'Add to Cleanup List'}
          </span>
        </button>
      </div>
    </div>
  );
};
