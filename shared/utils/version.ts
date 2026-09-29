/**
 * Compares two semantic version strings (e.g. "1.0.1" vs "1.0.0" or "v1.2.0" vs "1.1.9").
 * Returns:
 *   1 if a > b (a is newer)
 *  -1 if a < b (a is older)
 *   0 if a === b (versions are equal)
 */
export function compareSemver(a: string, b: string): number {
  const cleanA = a.replace(/^v/, '').trim();
  const cleanB = b.replace(/^v/, '').trim();

  const partsA = cleanA.split('.').map((p) => parseInt(p, 10) || 0);
  const partsB = cleanB.split('.').map((p) => parseInt(p, 10) || 0);

  const maxLen = Math.max(partsA.length, partsB.length, 3);
  for (let i = 0; i < maxLen; i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA > numB) return 1;
    if (numA < numB) return -1;
  }
  return 0;
}

/**
 * Checks if latestVersion is strictly greater than currentVersion.
 */
export function isNewerVersion(latestVersion: string, currentVersion: string): boolean {
  return compareSemver(latestVersion, currentVersion) > 0;
}

export interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface GitHubReleasePayload {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  assets?: GitHubReleaseAsset[];
}

/**
 * Selects the best download URL matching the user's OS platform (macOS, Windows, Linux) and architecture (arm64 vs x64).
 */
export function resolveDownloadUrl(
  release: GitHubReleasePayload,
  arch: string = 'x64',
  platform?: string
): string {
  if (!release.assets || release.assets.length === 0) {
    return release.html_url;
  }

  const plat = platform || (typeof process !== 'undefined' ? process.platform : 'darwin');
  const isArm = arch === 'arm64';

  // Windows asset resolution (.exe, Setup.exe, .msi)
  if (plat === 'win32' || plat === 'windows') {
    if (isArm) {
      const armExe = release.assets.find(
        (a) => a.name.toLowerCase().includes('arm64') && (a.name.toLowerCase().endsWith('.exe') || a.name.toLowerCase().endsWith('.msi'))
      );
      if (armExe) return armExe.browser_download_url;
    }
    const x64Exe = release.assets.find(
      (a) => (a.name.toLowerCase().includes('x64') || a.name.toLowerCase().includes('setup') || a.name.toLowerCase().includes('win')) &&
        (a.name.toLowerCase().endsWith('.exe') || a.name.toLowerCase().endsWith('.msi'))
    );
    if (x64Exe) return x64Exe.browser_download_url;

    const anyExe = release.assets.find(
      (a) => a.name.toLowerCase().endsWith('.exe') || a.name.toLowerCase().endsWith('.msi')
    );
    if (anyExe) return anyExe.browser_download_url;
  }

  // Linux asset resolution (.AppImage, .deb, .tar.gz)
  if (plat === 'linux') {
    const appImage = release.assets.find((a) => a.name.toLowerCase().endsWith('.appimage'));
    if (appImage) return appImage.browser_download_url;
    const deb = release.assets.find((a) => a.name.toLowerCase().endsWith('.deb'));
    if (deb) return deb.browser_download_url;
  }

  // macOS asset resolution (.dmg)
  if (isArm) {
    const armAsset = release.assets.find(
      (a) => a.name.toLowerCase().includes('arm64') && a.name.toLowerCase().endsWith('.dmg')
    );
    if (armAsset) return armAsset.browser_download_url;
  } else {
    const x64Asset = release.assets.find(
      (a) => !a.name.toLowerCase().includes('arm64') && a.name.toLowerCase().endsWith('.dmg')
    );
    if (x64Asset) return x64Asset.browser_download_url;
  }

  // Fallback to any DMG asset, or release page
  const anyDmg = release.assets.find((a) => a.name.toLowerCase().endsWith('.dmg'));
  return anyDmg ? anyDmg.browser_download_url : release.html_url;
}
