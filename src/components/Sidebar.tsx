/**
 * 側欄(U1 殼層,結構複製文管庫 Sidebar.tsx;IA-PLAN IA-D1/D2):
 * 同組漸層色以字「媒」區分品牌,不改 palette——index.css 設計系統 M0 已整套複製,
 * 故無需重跑對比度稽核。窄螢幕(≤720px)收合慣例由既有 CSS class 負責。
 * 家族切換連結屬 U2(期次刻意切分),本檔不放。
 */
import { APP_NAME, APP_TITLE, SIDEBAR_IDENTITY_SUB, TAB_ICONS, TAB_LABELS } from '../constants';
import type { TabKey } from '../types';

const NAV_ITEMS: Array<{ key: TabKey; icon: string; label: string }> = [
  { key: 'dashboard', icon: TAB_ICONS.dashboard, label: TAB_LABELS.dashboard },
  { key: 'media', icon: TAB_ICONS.media, label: TAB_LABELS.media },
  { key: 'history', icon: TAB_ICONS.history, label: TAB_LABELS.history },
  { key: 'library', icon: TAB_ICONS.library, label: TAB_LABELS.library },
];

interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="app-sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 24px 8px' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg,#6C5CE7,#FF7A59)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          媒
        </div>
        <div className="sidebar-brand-text" style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-main)' }}>
          {APP_TITLE}
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }} aria-label="主導覽">
        {NAV_ITEMS.map((item) => {
          const active = item.key === activeTab;
          return (
            <button
              key={item.key}
              type="button"
              className="nav-btn"
              onClick={() => onTabChange(item.key)}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                fontSize: 13.5,
                textAlign: 'left',
                fontWeight: active ? 700 : 500,
                color: active ? 'var(--brand)' : 'var(--text-sub)',
                background: active ? 'var(--pill-purple-bg)' : 'transparent',
              }}
            >
              <span style={{ fontSize: 18 }} aria-hidden="true">
                {item.icon}
              </span>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div
        className="sidebar-footer"
        style={{
          marginTop: 'auto',
          padding: '14px 12px',
          background: 'var(--surface-soft)',
          borderRadius: 12,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: 'linear-gradient(135deg,#6C5CE7,#FF7A59)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          媒
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>{APP_NAME}</div>
          <div style={{ fontSize: 11, color: 'var(--text-weak)' }}>{SIDEBAR_IDENTITY_SUB}</div>
        </div>
      </div>
    </div>
  );
}
