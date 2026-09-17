import { describe, it, expect } from 'vitest';
import { categorizeFile, aggregateCategories } from '../../shared/analyzer/categorizer';
import type { FileNode } from '../../shared/models/fileNode';

describe('categorizeFile', () => {
  it('identifies various file extensions correctly', () => {
    expect(categorizeFile('movie.mp4')).toBe('video');
    expect(categorizeFile('movie.MKV')).toBe('video');
    expect(categorizeFile('photo.png')).toBe('image');
    expect(categorizeFile('song.mp3')).toBe('audio');
    expect(categorizeFile('document.pdf')).toBe('document');
    expect(categorizeFile('archive.zip')).toBe('archive');
    expect(categorizeFile('app.dmg')).toBe('archive');
    expect(categorizeFile('code.tsx')).toBe('code');
    expect(categorizeFile('unknown.xyz123')).toBe('other');
  });
});

describe('aggregateCategories', () => {
  it('aggregates sizes and counts across nested trees', () => {
    const root: FileNode = {
      id: 'root',
      name: 'root',
      path: '/root',
      type: 'directory',
      size: 3500,
      children: [
        { id: '1', name: 'video.mp4', path: '/root/video.mp4', type: 'file', size: 2000, extension: 'mp4' },
        { id: '2', name: 'photo.jpg', path: '/root/photo.jpg', type: 'file', size: 1000, extension: 'jpg' },
        {
          id: 'sub',
          name: 'sub',
          path: '/root/sub',
          type: 'directory',
          size: 500,
          children: [
            { id: '3', name: 'code.ts', path: '/root/sub/code.ts', type: 'file', size: 500, extension: 'ts' }
          ]
        }
      ]
    };

    const stats = aggregateCategories(root);
    expect(stats.length).toBe(3);

    const videoStat = stats.find((s) => s.category === 'video');
    expect(videoStat?.size).toBe(2000);
    expect(videoStat?.fileCount).toBe(1);

    const imageStat = stats.find((s) => s.category === 'image');
    expect(imageStat?.size).toBe(1000);

    const codeStat = stats.find((s) => s.category === 'code');
    expect(codeStat?.size).toBe(500);
  });
});
