/** 發佈歷史卡:本機 metadata 記錄(媒體檔絕不入庫)——最新在前、可清除。 */
import {
  HISTORY_CLEAR,
  HISTORY_CLEAR_CONFIRM,
  HISTORY_EMPTY,
  HISTORY_HEADING,
  HISTORY_HINT,
  HISTORY_STATE_DUE,
  HISTORY_STATE_PENDING,
  HISTORY_STATUS_PUBLISHED,
  MEDIA_KIND_LABEL,
} from '../constants';
import { formatBytes, formatDateTime } from '../utils/format';
import type { PublishRecord } from '../services/history';
import { scheduleState } from '../utils/historyFilters';

interface HistoryCardProps {
  records: PublishRecord[];
  onClear: () => void;
  /** 篩選後無符合時的空文案(無記錄時沿用 HISTORY_EMPTY)。 */
  emptyText?: string;
}

export default function HistoryCard({ records, onClear, emptyText }: HistoryCardProps) {
  const nowMs = Date.now();
  return (
    <section className="card" style={{ padding: 24 }} aria-labelledby="history-heading">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h2 id="history-heading" style={{ margin: 0, fontSize: 16, color: 'var(--text-main)', flex: 1 }}>
            {HISTORY_HEADING}
          </h2>
          {records.length > 0 && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                if (window.confirm(HISTORY_CLEAR_CONFIRM)) onClear();
              }}
            >
              {HISTORY_CLEAR}
            </button>
          )}
        </div>
        <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--text-weak)' }}>{HISTORY_HINT}</p>

        {records.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-sub)' }}>{emptyText ?? HISTORY_EMPTY}</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {records.map((r) => {
              const state = scheduleState(r, nowMs);
              return (
              <li
                key={r.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'var(--surface-soft)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="pill pill-brand">{MEDIA_KIND_LABEL[r.mediaKind]}</span>
                  <span className={`pill ${state === 'pending' ? 'pill-accent' : 'pill-brand'}`}>
                    {state === 'pending' ? HISTORY_STATE_PENDING : state === 'due' ? HISTORY_STATE_DUE : HISTORY_STATUS_PUBLISHED}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', wordBreak: 'break-all' }}>
                    {r.mediaName}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{formatBytes(r.mediaSize)}</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>
                  {r.mode === 'schedule'
                    ? `排程於 ${formatDateTime(r.scheduledFor)}`
                    : `發佈於 ${formatDateTime(r.createdAt)}`}
                  {r.postId ? ` · 貼文 id ${r.postId}` : ''}
                </div>
                {r.caption && (
                  <div style={{ fontSize: 12.5, color: 'var(--text-weak)', wordBreak: 'break-word' }}>
                    {r.caption}
                  </div>
                )}
              </li>
              );
            })}
          </ul>
        )}
      </section>
  );
}
