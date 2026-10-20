/**
 * 發佈史頁篩選(IA-D2):發佈方式 × 媒體類型雙維篩選,與排程記錄的現在狀態判定。
 * 純函式、時間可注入(IA-PLAN §3.4)。
 */
import type { PublishRecord } from '../services/history';

export type HistoryModeFilter = 'all' | 'now' | 'schedule';
export type HistoryKindFilter = 'all' | 'image' | 'video';

export function filterRecords(
  records: readonly PublishRecord[],
  mode: HistoryModeFilter,
  kind: HistoryKindFilter,
): PublishRecord[] {
  return records.filter((r) => {
    if (mode !== 'all' && r.mode !== mode) return false;
    if (kind !== 'all' && r.mediaKind !== kind) return false;
    return true;
  });
}

/**
 * 排程記錄的現在狀態:'pending'=待發(尚未到排定時間)、'due'=應已發佈(已過排定時間)。
 * 立即發佈記錄或 scheduledFor=null 回 null(無排程狀態可標)。
 */
export function scheduleState(
  record: Pick<PublishRecord, 'mode' | 'scheduledFor'>,
  nowMs: number,
): 'pending' | 'due' | null {
  if (record.mode !== 'schedule' || record.scheduledFor === null) return null;
  return record.scheduledFor > nowMs ? 'pending' : 'due';
}
