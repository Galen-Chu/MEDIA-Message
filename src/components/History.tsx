/**
 * 發佈史頁(U1,IA-D2):發佈方式 × 媒體類型雙維篩選 chips(純邏輯在 utils/historyFilters)
 * + 記錄列表(沿用 HistoryCard)。列表為空但有記錄時,空文案改指「無符合篩選」。
 */
import { useState } from 'react';
import HistoryCard from './HistoryCard';
import {
  HISTORY_FILTER_ALL,
  HISTORY_FILTER_EMPTY,
  HISTORY_FILTER_IMAGE,
  HISTORY_FILTER_KIND_LABEL,
  HISTORY_FILTER_MODE_LABEL,
  HISTORY_FILTER_NOW,
  HISTORY_FILTER_SCHEDULE,
  HISTORY_FILTER_VIDEO,
  TAB_LABELS,
} from '../constants';
import type { PublishRecord } from '../services/history';
import {
  filterRecords,
  type HistoryKindFilter,
  type HistoryModeFilter,
} from '../utils/historyFilters';

interface HistoryPageProps {
  records: PublishRecord[];
  onClear: () => void;
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        fontSize: 12.5,
        fontWeight: active ? 700 : 500,
        padding: '5px 12px',
        borderRadius: 999,
        border: `1px solid ${active ? 'transparent' : 'var(--border-3)'}`,
        background: active ? 'var(--pill-purple-bg)' : 'var(--card)',
        color: active ? 'var(--brand)' : 'var(--text-sub)',
      }}
    >
      {label}
    </button>
  );
}

export default function HistoryPage({ records, onClear }: HistoryPageProps) {
  const [mode, setMode] = useState<HistoryModeFilter>('all');
  const [kind, setKind] = useState<HistoryKindFilter>('all');
  const filtered = filterRecords(records, mode, kind);

  return (
    <div style={{ maxWidth: 1080, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: 'var(--text-main)' }}>
          {TAB_LABELS.history}
        </h1>
      </header>

      <section className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div
          role="group"
          aria-label={HISTORY_FILTER_MODE_LABEL}
          style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-weak)' }}>{HISTORY_FILTER_MODE_LABEL}</span>
          <Chip label={HISTORY_FILTER_ALL} active={mode === 'all'} onClick={() => setMode('all')} />
          <Chip label={HISTORY_FILTER_NOW} active={mode === 'now'} onClick={() => setMode('now')} />
          <Chip label={HISTORY_FILTER_SCHEDULE} active={mode === 'schedule'} onClick={() => setMode('schedule')} />
        </div>
        <div
          role="group"
          aria-label={HISTORY_FILTER_KIND_LABEL}
          style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-weak)' }}>{HISTORY_FILTER_KIND_LABEL}</span>
          <Chip label={HISTORY_FILTER_ALL} active={kind === 'all'} onClick={() => setKind('all')} />
          <Chip label={HISTORY_FILTER_IMAGE} active={kind === 'image'} onClick={() => setKind('image')} />
          <Chip label={HISTORY_FILTER_VIDEO} active={kind === 'video'} onClick={() => setKind('video')} />
        </div>
      </section>

      <HistoryCard
        records={filtered}
        onClear={onClear}
        emptyText={records.length > 0 ? HISTORY_FILTER_EMPTY : undefined}
      />
    </div>
  );
}
