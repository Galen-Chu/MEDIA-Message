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
        <h1 className="t-page-title" style={{ margin: 0 }}>
          {TAB_LABELS.dashboard}
        </h1>
        <p className="t-page-desc" style={{ margin: '8px 0 0', color: 'var(--text-sub)' }}>{APP_TAGLINE}</p>
      </header>

      <section
        className="card"
        style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}
        aria-labelledby="dash-connect-heading"
      >
        <div style={{ flex: 1, minWidth: 220 }}>
          <h2 id="dash-connect-heading" className="t-sub" style={{ margin: '0 0 6px', fontWeight: 'var(--weight-bold)' }}>
            {DASH_CONNECT_HEADING}
          </h2>
          {fbStatus === 'connected' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="pill pill-brand">{DASH_FB_CONNECTED}</span>
              {pageName && <span className="t-item-title">{pageName}</span>}
            </div>
          ) : fbStatus === 'disabled' ? (
            <span className="t-body" style={{ color: 'var(--text-sub)' }}>{FB_STATUS_LABEL.disabled}</span>
          ) : (
            <span className="t-body" style={{ color: 'var(--text-sub)' }}>{DASH_FB_NOT_CONNECTED}</span>
          )}
        </div>
        <button type="button" className="btn btn-accent" onClick={onStart}>
          {DASH_START_BUTTON}
        </button>
      </section>

      <section aria-labelledby="dash-stats-heading">
        <h2 id="dash-stats-heading" className="t-sub" style={{ margin: '0 0 10px', fontWeight: 'var(--weight-bold)' }}>
          {DASH_STATS_HEADING}
        </h2>
        <div className="stat-row" style={{ display: 'flex', gap: 12 }}>
          {statCards.map((c) => (
            <div key={c.label} className="card stat-card" style={{ padding: 16 }}>
              <div className="t-sub" style={{ fontWeight: 'var(--weight-bold)' }}>{c.label}</div>
              <div className="t-stat" style={{ color: 'var(--brand)', marginTop: 4 }}>{c.value}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ padding: 20 }} aria-labelledby="dash-upcoming-heading">
        <h2 id="dash-upcoming-heading" className="t-sec-title" style={{ margin: '0 0 12px' }}>
          {DASH_UPCOMING_HEADING}
        </h2>
        {upcoming.length === 0 ? (
          <p className="t-body" style={{ margin: 0, color: 'var(--text-sub)' }}>{DASH_UPCOMING_EMPTY}</p>
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
                  <span className="pill pill-accent">{formatDateTime(u.scheduledFor)}</span>
                  <span className="t-item-title" style={{ wordBreak: 'break-all' }}>
                    {u.mediaName}
                  </span>
                </div>
                {u.caption && (
                  <div className="t-sub" style={{ wordBreak: 'break-word' }}>{u.caption}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
