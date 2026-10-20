/**
 * 媒管 Dashboard 頁(U1,IA-D2):統計卡(本月已發佈/待發排程/圖片數/影片數,
 * 由發佈歷史 metadata 即時推導)+ 連線摘要 + 近期排程前 3 筆 + 開始發佈入口。
 */
import {
  APP_TAGLINE,
  DASH_CONNECT_HEADING,
  DASH_FB_CONNECTED,
  DASH_FB_NOT_CONNECTED,
  DASH_START_BUTTON,
  DASH_STAT_IMAGES,
  DASH_STAT_PENDING,
  DASH_STAT_PUBLISHED_MONTH,
  DASH_STAT_VIDEOS,
  DASH_STATS_HEADING,
  DASH_UPCOMING_EMPTY,
  DASH_UPCOMING_HEADING,
  FB_STATUS_LABEL,
  TAB_LABELS,
} from '../constants';
import type { FacebookStatus } from '../hooks/useFacebook';
import type { PublishRecord } from '../services/history';
import { computeDashboardStats, upcomingSchedules } from '../utils/dashboard';
import { formatDateTime } from '../utils/format';

interface DashboardProps {
  records: PublishRecord[];
  fbStatus: FacebookStatus;
  pageName: string | null;
  onStart: () => void;
}

export default function Dashboard({ records, fbStatus, pageName, onStart }: DashboardProps) {
  const nowMs = Date.now();
  const stats = computeDashboardStats(records, nowMs);
  const upcoming = upcomingSchedules(records, nowMs);
  const statCards = [
    { label: DASH_STAT_PUBLISHED_MONTH, value: stats.publishedThisMonth },
    { label: DASH_STAT_PENDING, value: stats.pendingSchedules },
    { label: DASH_STAT_IMAGES, value: stats.imageCount },
    { label: DASH_STAT_VIDEOS, value: stats.videoCount },
  ];

  return (
    <div style={{ maxWidth: 1080, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: 'var(--text-main)' }}>
          {TAB_LABELS.dashboard}
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-sub)' }}>{APP_TAGLINE}</p>
      </header>

      <section
        className="card"
        style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
        aria-labelledby="dash-connect-heading"
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <h2
            id="dash-connect-heading"
            style={{ margin: '0 0 6px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-weak)' }}
          >
            {DASH_CONNECT_HEADING}
          </h2>
          {fbStatus === 'connected' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="pill pill-purple">{DASH_FB_CONNECTED}</span>
              {pageName && (
                <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-main)' }}>{pageName}</span>
              )}
            </div>
          ) : fbStatus === 'disabled' ? (
            <span style={{ fontSize: 13.5, color: 'var(--text-sub)' }}>{FB_STATUS_LABEL.disabled}</span>
          ) : (
            <span style={{ fontSize: 13.5, color: 'var(--text-sub)' }}>{DASH_FB_NOT_CONNECTED}</span>
          )}
        </div>
        <button type="button" className="btn btn-accent" onClick={onStart}>
          {DASH_START_BUTTON}
        </button>
      </section>

      <section aria-labelledby="dash-stats-heading">
        <h2
          id="dash-stats-heading"
          style={{ margin: '0 0 10px', fontSize: 12.5, fontWeight: 700, color: 'var(--text-weak)' }}
        >
          {DASH_STATS_HEADING}
        </h2>
        <div className="stat-row" style={{ display: 'flex', gap: 12 }}>
          {statCards.map((c) => (
            <div key={c.label} className="card stat-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-weak)', fontWeight: 700 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--brand)', marginTop: 4 }}>{c.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ padding: 20 }} aria-labelledby="dash-upcoming-heading">
        <h2
          id="dash-upcoming-heading"
          style={{ margin: '0 0 12px', fontSize: 13.5, fontWeight: 700, color: 'var(--text-main)' }}
        >
          {DASH_UPCOMING_HEADING}
        </h2>
        {upcoming.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-sub)' }}>{DASH_UPCOMING_EMPTY}</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {upcoming.map((u) => (
              <li
                key={u.id}
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
                  <span className="pill pill-orange">{formatDateTime(u.scheduledFor)}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', wordBreak: 'break-all' }}>
                    {u.mediaName}
                  </span>
                </div>
                {u.caption && (
                  <div style={{ fontSize: 12.5, color: 'var(--text-weak)', wordBreak: 'break-word' }}>{u.caption}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
