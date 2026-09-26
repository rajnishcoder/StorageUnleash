import { describe, it, expect } from 'vitest';
import { compareSemver, isNewerVersion, resolveDownloadUrl, GitHubReleasePayload } from '../../shared/utils/version';

describe('compareSemver', () => {
  it('correctly compares semantic versions', () => {
    expect(compareSemver('1.0.1', '1.0.0')).toBe(1);
    expect(compareSemver('v1.0.1', '1.0.0')).toBe(1);
    expect(compareSemver('1.1.0', '1.0.9')).toBe(1);
    expect(compareSemver('2.0.0', '1.9.9')).toBe(1);

    expect(compareSemver('1.0.0', '1.0.1')).toBe(-1);
    expect(compareSemver('1.0.0', '1.1.0')).toBe(-1);
    expect(compareSemver('1.0.0', 'v2.0.0')).toBe(-1);

    expect(compareSemver('1.0.0', '1.0.0')).toBe(0);
    expect(compareSemver('v1.0.0', '1.0.0')).toBe(0);
  });

  it('determines if a version is newer', () => {
    expect(isNewerVersion('1.0.1', '1.0.0')).toBe(true);
    expect(isNewerVersion('v1.1.0', '1.0.0')).toBe(true);
    expect(isNewerVersion('1.0.0', '1.0.0')).toBe(false);
    expect(isNewerVersion('0.9.9', '1.0.0')).toBe(false);
  });
});

describe('resolveDownloadUrl', () => {
  const sampleRelease: GitHubReleasePayload = {
    tag_name: 'v1.0.1',
    name: 'Storage Unleashed v1.0.1',
    body: 'Bug fixes and performance improvements.',
    html_url: 'https://github.com/rajnishcoder/StorageUnleash/releases/tag/v1.0.1',
    published_at: '2026-09-26T12:00:00Z',
    assets: [
      {
        name: 'StorageUnleash-1.0.1-arm64.dmg',
        browser_download_url: 'https://github.com/rajnishcoder/StorageUnleash/releases/download/v1.0.1/StorageUnleash-1.0.1-arm64.dmg',
        size: 104000000
      },
      {
        name: 'StorageUnleash-1.0.1.dmg',
        browser_download_url: 'https://github.com/rajnishcoder/StorageUnleash/releases/download/v1.0.1/StorageUnleash-1.0.1.dmg',
        size: 108000000
      }
    ]
  };

  it('selects arm64 DMG for Apple Silicon', () => {
    const url = resolveDownloadUrl(sampleRelease, 'arm64');
    expect(url).toBe('https://github.com/rajnishcoder/StorageUnleash/releases/download/v1.0.1/StorageUnleash-1.0.1-arm64.dmg');
  });

  it('selects x64 DMG for Intel Macs', () => {
    const url = resolveDownloadUrl(sampleRelease, 'x64');
    expect(url).toBe('https://github.com/rajnishcoder/StorageUnleash/releases/download/v1.0.1/StorageUnleash-1.0.1.dmg');
  });

  it('falls back to html_url if no assets exist', () => {
    const emptyRelease: GitHubReleasePayload = {
      ...sampleRelease,
      assets: []
    };
    expect(resolveDownloadUrl(emptyRelease, 'arm64')).toBe(sampleRelease.html_url);
  });
});
