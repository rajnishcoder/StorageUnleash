import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import type { QuickTarget } from '@shared/types/ipc';

/**
 * Returns available system quick targets for the current operating system.
 */
export async function getSystemQuickTargets(): Promise<QuickTarget[]> {
  const platform = process.platform;
  const home = os.homedir();
  const targets: QuickTarget[] = [];

  // Home Directory
  targets.push({
    id: 'home',
    name: 'Home',
    path: home,
    iconType: 'home',
    description: `User Home (~)`
  });

  // Users Directory
  const usersPath = platform === 'darwin' ? '/Users' : (platform === 'win32' ? 'C:\\Users' : '/home');
  if (fs.existsSync(usersPath)) {
    targets.push({
      id: 'users',
      name: 'Users',
      path: usersPath,
      iconType: 'users',
      description: 'All User Accounts'
    });
  }

  // Applications Directory
  let appPath = '/Applications';
  if (platform === 'win32') {
    appPath = process.env.ProgramFiles || 'C:\\Program Files';
  } else if (platform === 'linux') {
    appPath = '/usr/bin';
  }

  if (fs.existsSync(appPath)) {
    targets.push({
      id: 'applications',
      name: 'Applications',
      path: appPath,
      iconType: 'applications',
      description: 'Installed Applications'
    });
  }

  // Downloads Directory
  const downloadsPath = path.join(home, 'Downloads');
  if (fs.existsSync(downloadsPath)) {
    targets.push({
      id: 'downloads',
      name: 'Downloads',
      path: downloadsPath,
      iconType: 'downloads',
      description: 'Recent Downloads'
    });
  }

  // Documents Directory
  const docsPath = path.join(home, 'Documents');
  if (fs.existsSync(docsPath)) {
    targets.push({
      id: 'documents',
      name: 'Documents',
      path: docsPath,
      iconType: 'documents',
      description: 'Personal Documents'
    });
  }

  return targets;
}
