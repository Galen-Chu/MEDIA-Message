import {
  APP_TITLE,
  APP_NAME,
  APP_TAGLINE,
  STATUS_HEADING,
  STATUS_M0,
  STATUS_M0_PILL,
  STATUS_M1,
  STATUS_M1_PILL,
  PLATFORM_HEADING,
  PLATFORM_NOTE,
  PLATFORM_SUPPORT,
} from './constants';

/** M0 殼層:品牌定位+狀態+平台規劃。M1 將以「附件為主、說明為輔」編輯器 IA 取代本頁。 */
export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <main
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: '56px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
      >
        <header>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 900, color: 'var(--text-main)' }}>
            {APP_TITLE}
            <span style={{ marginLeft: 12, fontSize: 22, fontWeight: 700, color: 'var(--brand)' }}>
              {APP_NAME}
            </span>
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 14, color: 'var(--text-sub)' }}>{APP_TAGLINE}</p>
        </header>

        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ margin: '0 0 14px', fontSize: 16, color: 'var(--text-main)' }}>{STATUS_HEADING}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="pill pill-purple">{STATUS_M0_PILL}</span>
              <span style={{ fontSize: 13.5, color: 'var(--text-sub)' }}>{STATUS_M0}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="pill pill-orange">{STATUS_M1_PILL}</span>
              <span style={{ fontSize: 13.5, color: 'var(--text-sub)' }}>{STATUS_M1}</span>
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: 24 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--text-main)' }}>{PLATFORM_HEADING}</h2>
          <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--text-weak)' }}>{PLATFORM_NOTE}</p>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {PLATFORM_SUPPORT.map((row) => (
              <li
                key={row.platform}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'var(--surface-soft)',
                }}
              >
                <span style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-main)' }}>
                  {row.platform}
                </span>
                <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text-sub)' }}>
                  {row.capability}・{row.schedule}
                </span>
                <span className="pill pill-purple">{row.phase}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
