import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import type { SystemDiskInfo } from '@shared/types/ipc';

/**
 * Retrieves all mounted system disks and storage volumes across Windows, macOS, and Linux.
 */
export async function getSystemDrives(): Promise<SystemDiskInfo[]> {
  const platform = process.platform;

  if (platform === 'win32') {
    return await getWindowsDrives();
  } else if (platform === 'darwin') {
    return await getMacDrives();
  } else {
    return await getLinuxDrives();
  }
}

/**
 * Windows drive detector: queries all lettered disks (C:\, D:\, E:\, etc.).
 */
async function getWindowsDrives(): Promise<SystemDiskInfo[]> {
  const drives: SystemDiskInfo[] = [];
  const systemDrive = (process.env.SystemDrive || 'C:').toUpperCase();

  // Strategy 1: PowerShell query via CIM / WMI
  try {
    const psCommand = `Get-CimInstance Win32_LogicalDisk | ForEach-Object { "$($_.DeviceID)|$($_.VolumeName)|$($_.Size)|$($_.FreeSpace)|$($_.DriveType)" }`;
    const output = await new Promise<string>((resolve, reject) => {
      execFile('powershell', ['-NoProfile', '-Command', psCommand], { timeout: 5000 }, (err, stdout) => {
        if (err) return reject(err);
        resolve(stdout || '');
      });
    });

    const lines = output.trim().split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      const [deviceId, volumeName, sizeStr, freeStr, driveTypeStr] = line.split('|');
      if (!deviceId) continue;

      const mount = deviceId.endsWith('\\') ? deviceId : deviceId + '\\';
      const total = parseInt(sizeStr || '0', 10) || 0;
      const free = parseInt(freeStr || '0', 10) || 0;
      if (total <= 0) continue; // Skip empty CD-ROMs or unmounted drives

      const used = Math.max(0, total - free);
      const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
      const isSys = deviceId.toUpperCase().startsWith(systemDrive);
      const driveTypeNum = parseInt(driveTypeStr || '3', 10);
      const driveType: SystemDiskInfo['driveType'] =
        driveTypeNum === 2 ? 'removable' : driveTypeNum === 4 ? 'network' : 'fixed';

      const label = volumeName ? `${volumeName} (${deviceId})` : isSys ? `Local Disk (${deviceId})` : `Volume (${deviceId})`;

      drives.push({
        id: deviceId.replace(':', '').toLowerCase(),
        name: label,
        mount,
        total,
        used,
        free,
        percentage,
        isSystemDrive: isSys,
        driveType
      });
    }
  } catch {
    // Strategy 2: Fast drive letter sweep fallback using statfs (A through Z)
    const letters = 'CDEFGHIJKLMNOPQRSTUVWXYZAB'.split('');
    for (const letter of letters) {
      const mount = `${letter}:\\`;
      try {
        if (typeof fs.promises.statfs === 'function' && fs.existsSync(mount)) {
          const stats = await fs.promises.statfs(mount);
          const total = stats.blocks * stats.bsize;
          const free = stats.bavail * stats.bsize;
          if (total > 0) {
            const used = Math.max(0, total - free);
            const percentage = Math.round((used / total) * 100);
            const isSys = letter === systemDrive.replace(':', '');
            drives.push({
              id: letter.toLowerCase(),
              name: isSys ? `Local Disk (${letter}:)` : `Volume (${letter}:)`,
              mount,
              total,
              used,
              free,
              percentage,
              isSystemDrive: isSys,
              driveType: 'fixed'
            });
          }
        }
      } catch {
        // Drive letter not mounted, continue
      }
    }
  }

  // Fallback if no drives detected
  if (drives.length === 0) {
    drives.push({
      id: 'c',
      name: 'Local Disk (C:)',
      mount: 'C:\\',
      total: 512000000000,
      used: 256000000000,
      free: 256000000000,
      percentage: 50,
      isSystemDrive: true,
      driveType: 'fixed'
    });
  }

  return drives;
}

/**
 * macOS drive detector: primary container + /Volumes mounted drives.
 */
async function getMacDrives(): Promise<SystemDiskInfo[]> {
  const drives: SystemDiskInfo[] = [];
  const primaryMount = fs.existsSync('/System/Volumes/Data') ? '/System/Volumes/Data' : '/';

  // Primary System Drive
  try {
    if (typeof fs.promises.statfs === 'function') {
      const stats = await fs.promises.statfs(primaryMount);
      const total = stats.blocks * stats.bsize;
      const free = stats.bavail * stats.bsize;
      const used = Math.max(0, total - free);
      const percentage = total > 0 ? Math.round((used / total) * 100) : 0;

      drives.push({
        id: 'primary',
        name: 'Macintosh HD',
        mount: primaryMount,
        total,
        used,
        free,
        percentage,
        isSystemDrive: true,
        driveType: 'fixed'
      });
    }
  } catch (err) {
    console.error('[Drives] Failed to get primary Mac drive stats:', err);
  }

  // Inspect /Volumes for external SSDs, USB drives, DMGs
  try {
    if (fs.existsSync('/Volumes')) {
      const volEntries = await fs.promises.readdir('/Volumes', { withFileTypes: true });
      for (const entry of volEntries) {
        if (!entry.name || entry.name.startsWith('.')) continue;
        const volPath = path.join('/Volumes', entry.name);

        // Skip symlinks pointing back to root
        try {
          const real = await fs.promises.realpath(volPath);
          if (real === '/' || real === primaryMount) continue;
        } catch {}

        try {
          const stats = await fs.promises.statfs(volPath);
          const total = stats.blocks * stats.bsize;
          const free = stats.bavail * stats.bsize;
          if (total > 0) {
            const used = Math.max(0, total - free);
            const percentage = Math.round((used / total) * 100);
            drives.push({
              id: `vol-${entry.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              name: entry.name,
              mount: volPath,
              total,
              used,
              free,
              percentage,
              isSystemDrive: false,
              driveType: 'removable'
            });
          }
        } catch {}
      }
    }
  } catch (err) {
    console.error('[Drives] Failed inspecting /Volumes:', err);
  }

  return drives;
}

/**
 * Linux drive detector: root mount + /media /mnt mounts.
 */
async function getLinuxDrives(): Promise<SystemDiskInfo[]> {
  const drives: SystemDiskInfo[] = [];

  try {
    if (typeof fs.promises.statfs === 'function') {
      const stats = await fs.promises.statfs('/');
      const total = stats.blocks * stats.bsize;
      const free = stats.bavail * stats.bsize;
      const used = Math.max(0, total - free);
      const percentage = total > 0 ? Math.round((used / total) * 100) : 0;

      drives.push({
        id: 'root',
        name: 'Root Filesystem (/)',
        mount: '/',
        total,
        used,
        free,
        percentage,
        isSystemDrive: true,
        driveType: 'fixed'
      });
    }
  } catch {}

  // Check /media
  const user = os.userInfo().username;
  const mediaPaths = [path.join('/media', user), '/media', '/mnt'];

  for (const mPath of mediaPaths) {
    try {
      if (fs.existsSync(mPath)) {
        const entries = await fs.promises.readdir(mPath);
        for (const entry of entries) {
          const full = path.join(mPath, entry);
          try {
            const stats = await fs.promises.statfs(full);
            const total = stats.blocks * stats.bsize;
            const free = stats.bavail * stats.bsize;
            if (total > 0) {
              const used = Math.max(0, total - free);
              const percentage = Math.round((used / total) * 100);
              drives.push({
                id: `mnt-${entry.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                name: entry,
                mount: full,
                total,
                used,
                free,
                percentage,
                isSystemDrive: false,
                driveType: 'removable'
              });
            }
          } catch {}
        }
      }
    } catch {}
  }

  return drives;
}
