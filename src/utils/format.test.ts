import { describe, expect, it } from 'vitest';
import { formatBytes, formatDateTime } from './format';

describe('formatBytes', () => {
  it('各數量級與無效值', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(999)).toBe('999 B');
    expect(formatBytes(4096)).toBe('4.0 KB');
    expect(formatBytes(4 * 1024 * 1024)).toBe('4.0 MB');
    expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe('1.5 GB');
    expect(formatBytes(Number.NaN)).toBe('—');
    expect(formatBytes(-1)).toBe('—');
  });
});

describe('formatDateTime', () => {
  it('空值 → em dash;有值 → 含年月日時分', () => {
    expect(formatDateTime(null)).toBe('—');
    const text = formatDateTime(new Date(2026, 9, 5, 14, 30).getTime());
    expect(text).toContain('2026');
    expect(text).toContain('14');
    expect(text).toContain('30');
  });
});
