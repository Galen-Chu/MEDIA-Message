/** 發佈面板:FB 連線狀態機+粉專選擇+立即/排程+進度與錯誤顯示(env 未設=示範模式,不出現連線區)。 */
import {
  FB_STATUS_LABEL,
  PUBLISH_BUTTON_NOW,
  PUBLISH_BUTTON_SCHEDULE,
  PUBLISH_CONNECT,
  PUBLISH_DISCONNECT,
  PUBLISH_DEMO_NOTE,
  PUBLISH_HEADING,
  PUBLISH_MODE_LABEL,
  PUBLISH_MODE_NOW,
  PUBLISH_MODE_SCHEDULE,
  PUBLISH_PAGE_LABEL,
  PUBLISH_SCHEDULE_LABEL,
  PUBLISH_UPLOADING,
} from '../constants';
import type { FacebookStatus } from '../hooks/useFacebook';
import type { FacebookPageInfo } from '../hooks/useFacebook';

interface PublishPanelProps {
  status: FacebookStatus;
  errorText: string | null;
  pages: FacebookPageInfo[];
  selectedPageId: string | null;
  onSelectPage: (pageId: string) => void;
  connecting: boolean;
  publishing: boolean;
  progress: number | null;
  hasMedia: boolean;
  mode: 'now' | 'schedule';
  onModeChange: (mode: 'now' | 'schedule') => void;
  scheduleValue: string;
  onScheduleValueChange: (value: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  onPublish: () => void;
}

function statusPillClass(status: FacebookStatus): string {
  if (status === 'connected') return 'pill pill-purple';
  if (status === 'error') return 'pill pill-orange';
  return 'pill pill-purple';
}

export default function PublishPanel(props: PublishPanelProps) {
  const {
    status,
    errorText,
    pages,
    selectedPageId,
    onSelectPage,
    connecting,
    publishing,
    progress,
    hasMedia,
    mode,
    onModeChange,
    scheduleValue,
    onScheduleValueChange,
    onConnect,
    onDisconnect,
    onPublish,
  } = props;

  const disabled = status === 'disabled';
  const canPublish =
    !disabled && status === 'connected' && hasMedia && !publishing && !connecting &&
    (mode === 'now' || scheduleValue !== '');

  return (
    <section className="card" style={{ padding: 24 }} aria-labelledby="publish-heading">
      <h2 id="publish-heading" style={{ margin: '0 0 12px', fontSize: 16, color: 'var(--text-main)' }}>
        {PUBLISH_HEADING}
      </h2>

      {disabled ? (
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-sub)' }}>{PUBLISH_DEMO_NOTE}</p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <span className={statusPillClass(status)}>{FB_STATUS_LABEL[status]}</span>
            {status === 'connected' || status === 'error' ? (
              <button type="button" className="btn btn-ghost" onClick={onDisconnect}>
                {PUBLISH_DISCONNECT}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onConnect}
                disabled={connecting || status === 'connecting'}
              >
                {connecting ? FB_STATUS_LABEL.connecting : PUBLISH_CONNECT}
              </button>
            )}
          </div>

          {status === 'connected' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <div className="field-label">{PUBLISH_PAGE_LABEL}</div>
                <select
                  className="text-input"
                  value={selectedPageId ?? ''}
                  onChange={(e) => onSelectPage(e.target.value)}
                  aria-label={PUBLISH_PAGE_LABEL}
                >
                  {pages.map((page) => (
                    <option key={page.pageId} value={page.pageId}>
                      {page.pageName}
                    </option>
                  ))}
                </select>
              </div>

              <fieldset style={{ border: 'none', margin: '0 0 12px', padding: 0 }}>
                <legend className="field-label" style={{ padding: 0 }}>
                  {PUBLISH_MODE_LABEL}
                </legend>
                <div style={{ display: 'flex', gap: 18, fontSize: 13.5, color: 'var(--text-main)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="radio"
                      name="publish-mode"
                      checked={mode === 'now'}
                      onChange={() => onModeChange('now')}
                    />
                    {PUBLISH_MODE_NOW}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="radio"
                      name="publish-mode"
                      checked={mode === 'schedule'}
                      onChange={() => onModeChange('schedule')}
                    />
                    {PUBLISH_MODE_SCHEDULE}
                  </label>
                </div>
              </fieldset>

              {mode === 'schedule' && (
                <div style={{ marginBottom: 12 }}>
                  <div className="field-label">{PUBLISH_SCHEDULE_LABEL}</div>
                  <input
                    type="datetime-local"
                    className="text-input"
                    value={scheduleValue}
                    onChange={(e) => onScheduleValueChange(e.target.value)}
                    aria-label={PUBLISH_SCHEDULE_LABEL}
                  />
                </div>
              )}
            </>
          )}
        </>
      )}

      {publishing && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, color: 'var(--text-sub)', marginBottom: 4 }}>
            {PUBLISH_UPLOADING}
            {progress != null ? ` ${Math.round(progress * 100)}%` : ''}
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: 'var(--border-3)',
              overflow: 'hidden',
            }}
            role="progressbar"
            aria-valuenow={progress != null ? Math.round(progress * 100) : undefined}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              style={{
                width: `${Math.round((progress ?? 0) * 100)}%`,
                height: '100%',
                background: 'var(--brand-fill)',
                transition: 'width 0.2s ease',
              }}
            />
          </div>
        </div>
      )}

      {errorText && (
        <p role="alert" style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--error)' }}>
          {errorText}
        </p>
      )}

      <button
        type="button"
        className="btn btn-accent"
        onClick={onPublish}
        disabled={!canPublish}
      >
        {mode === 'schedule' ? PUBLISH_BUTTON_SCHEDULE : PUBLISH_BUTTON_NOW}
      </button>
    </section>
  );
}
