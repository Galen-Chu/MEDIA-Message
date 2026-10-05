/** 顯示用格式化輔助(純邏輯)。 */

/** 檔案大小: bytes → 人類可讀(B/KB/MB/GB,一位小數)。 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/** 本機時間(zh-TW,24 小時制):供排程與歷史顯示。 */
export function formatDateTime(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms)) return '—';
  return new Date(ms).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
