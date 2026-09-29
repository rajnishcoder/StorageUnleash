import { describe, it, expect } from 'vitest';
import {
  getPlatformDetails,
  normalizeCrossPath,
  splitPathSegments,
  isDriveRoot
} from '../../shared/platform/platformInfo';
import { resolveDownloadUrl } from '../../shared/utils/version';

describe('Cross-Platform Platform Information & Utilities', () => {
  it('correctly identifies macOS details', () => {
    const details = getPlatformDetails('darwin');
    expect(details.isMac).toBe(true);
    expect(details.isWindows).toBe(false);
    expect(details.fileManagerName).toBe('Finder');
    expect(details.trashName).toBe('Trash');
    expect(details.modKey).toBe('⌘');
    expect(details.pathSeparator).toBe('/');
  });

  it('correctly identifies Windows details', () => {
    const details = getPlatformDetails('win32');
    expect(details.isMac).toBe(false);
    expect(details.isWindows).toBe(true);
    expect(details.fileManagerName).toBe('File Explorer');
    expect(details.trashName).toBe('Recycle Bin');
    expect(details.modKey).toBe('Ctrl');
    expect(details.pathSeparator).toBe('\\');
  });

  it('normalizes Windows and Unix paths correctly', () => {
    expect(normalizeCrossPath('C:/Users/John/Downloads/')).toBe('C:\\Users\\John\\Downloads');
    expect(normalizeCrossPath('C:\\Users\\John\\Downloads\\')).toBe('C:\\Users\\John\\Downloads');
    expect(normalizeCrossPath('C:')).toBe('C:\\');
    expect(normalizeCrossPath('c:\\')).toBe('c:\\');
    expect(normalizeCrossPath('/Users/john/Downloads/')).toBe('/Users/john/Downloads');
    expect(normalizeCrossPath('///Users///john')).toBe('/Users/john');
    expect(normalizeCrossPath('/')).toBe('/');
  });

  it('splits path segments for cross-platform breadcrumbs', () => {
    expect(splitPathSegments('C:\\Users\\John\\Documents')).toEqual(['C:\\', 'Users', 'John', 'Documents']);
    expect(splitPathSegments('C:\\')).toEqual(['C:\\']);
    expect(splitPathSegments('/Users/john/Documents')).toEqual(['/', 'Users', 'john', 'Documents']);
    expect(splitPathSegments('/')).toEqual(['/']);
  });

  it('detects drive roots accurately', () => {
    expect(isDriveRoot('C:\\')).toBe(true);
    expect(isDriveRoot('D:\\')).toBe(true);
    expect(isDriveRoot('/')).toBe(true);
    expect(isDriveRoot('C:\\Users')).toBe(false);
    expect(isDriveRoot('/Users/john')).toBe(false);
  });

  it('resolves download assets for both macOS and Windows', () => {
    const releasePayload = {
      tag_name: 'v1.1.0',
      name: 'v1.1.0',
      body: 'Release notes',
      html_url: 'https://github.com/rajnishcoder/StorageUnleashed/releases/tag/v1.1.0',
      published_at: '2026-09-29T10:00:00Z',
      assets: [
        {
          name: 'StorageUnleashed-1.1.0-arm64.dmg',
          browser_download_url: 'https://github.com/.../StorageUnleashed-1.1.0-arm64.dmg',
          size: 1000000
        },
        {
          name: 'StorageUnleashed-1.1.0.dmg',
          browser_download_url: 'https://github.com/.../StorageUnleashed-1.1.0.dmg',
          size: 1000000
        },
        {
          name: 'StorageUnleashed-Setup-1.1.0.exe',
          browser_download_url: 'https://github.com/.../StorageUnleashed-Setup-1.1.0.exe',
          size: 1000000
        }
      ]
    };

    // Windows resolution
    const winUrl = resolveDownloadUrl(releasePayload, 'x64', 'win32');
    expect(winUrl).toBe('https://github.com/.../StorageUnleashed-Setup-1.1.0.exe');

    // Mac arm64 resolution
    const macArmUrl = resolveDownloadUrl(releasePayload, 'arm64', 'darwin');
    expect(macArmUrl).toBe('https://github.com/.../StorageUnleashed-1.1.0-arm64.dmg');

    // Mac Intel resolution
    const macX64Url = resolveDownloadUrl(releasePayload, 'x64', 'darwin');
    expect(macX64Url).toBe('https://github.com/.../StorageUnleashed-1.1.0.dmg');
  });
});
