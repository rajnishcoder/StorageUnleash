import { app, ipcMain } from 'electron';
import { IPC_CHANNELS, AppUpdateInfo } from '@shared/types/ipc';
import { isNewerVersion, resolveDownloadUrl, GitHubReleasePayload } from '@shared/utils/version';

const GITHUB_REPO = 'rajnishcoder/StorageUnleash';
const GITHUB_RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const GITHUB_RELEASES_PAGE = `https://github.com/${GITHUB_REPO}/releases/latest`;

/**
 * Checks GitHub Releases API for new updates.
 */
export async function checkForAppUpdates(): Promise<AppUpdateInfo> {
  const currentVersion = app.getVersion() || '1.0.0';
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64';

  try {
    const response = await fetch(GITHUB_RELEASES_API, {
      headers: {
        'User-Agent': `StorageUnleash-Desktop-App/v${currentVersion}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      // If repository has no releases or API rate limit, fallback gracefully
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
        downloadUrl: GITHUB_RELEASES_PAGE,
        releaseUrl: GITHUB_RELEASES_PAGE
      };
    }

    const payload = (await response.json()) as GitHubReleasePayload;
    const latestTag = payload.tag_name || currentVersion;
    const latestVersion = latestTag.replace(/^v/, '');

    const hasUpdate = isNewerVersion(latestVersion, currentVersion);
    const downloadUrl = resolveDownloadUrl(payload, arch);

    return {
      hasUpdate,
      currentVersion,
      latestVersion,
      releaseName: payload.name || `Version ${latestVersion}`,
      releaseNotes: payload.body || '',
      releaseDate: payload.published_at,
      downloadUrl,
      releaseUrl: payload.html_url || GITHUB_RELEASES_PAGE
    };
  } catch (error) {
    console.error('[Main] Failed to check for updates from GitHub:', error);
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      downloadUrl: GITHUB_RELEASES_PAGE,
      releaseUrl: GITHUB_RELEASES_PAGE
    };
  }
}

/**
 * Registers update-related IPC handlers in Electron.
 */
export function registerUpdateHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.CHECK_FOR_UPDATES, async () => {
    return await checkForAppUpdates();
  });
}
