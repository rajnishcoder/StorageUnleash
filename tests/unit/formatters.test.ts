import { describe, it, expect } from 'vitest';
import { formatBytes, formatNumber, formatDuration, truncatePath } from '../../shared/utils/formatters';

describe('formatBytes', () => {
  it('formats 0 bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes, KB, MB, GB, TB correctly using decimal base 1000', () => {
    expect(formatBytes(500)).toBe('500.00 B');
    expect(formatBytes(1000)).toBe('1.00 KB');
    expect(formatBytes(1000 * 1000)).toBe('1.00 MB');
    expect(formatBytes(1000 * 1000 * 1000)).toBe('1.00 GB');
    expect(formatBytes(245.11 * 1000 * 1000 * 1000, 2)).toBe('245.11 GB');
    expect(formatBytes(1000 * 1000 * 1000 * 1000)).toBe('1.00 TB');
  });

  it('handles negative bytes safely', () => {
    expect(formatBytes(-1000)).toBe('-1.00 KB');
  });

  it('handles custom decimal precision', () => {
    expect(formatBytes(1500, 1)).toBe('1.5 KB');
    expect(formatBytes(1500, 0)).toBe('2 KB');
  });
});

describe('formatNumber', () => {
  it('formats integers with commas', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(1284421)).toBe('1,284,421');
  });
});

describe('formatDuration', () => {
  it('formats milliseconds, seconds, and minutes', () => {
    expect(formatDuration(450)).toBe('450ms');
    expect(formatDuration(1500)).toBe('1.5s');
    expect(formatDuration(65000)).toBe('1m 5s');
  });
});

describe('truncatePath', () => {
  it('leaves short paths untouched', () => {
    expect(truncatePath('/Users/developer/Documents', 50)).toBe('/Users/developer/Documents');
  });

  it('shortens long paths with ellipsis', () => {
    const longPath = '/Users/developer/Documents/VeryLongDirectoryName/NestedFolder/AnotherDeepFolder/Target';
    const truncated = truncatePath(longPath, 40);
    expect(truncated).toContain('...');
    expect(truncated.startsWith('/Users')).toBe(true);
    expect(truncated.endsWith('Target')).toBe(true);
  });
});
