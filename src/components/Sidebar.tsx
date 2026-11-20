/**
 * 側欄(U1 殼層,結構複製文管庫 Sidebar.tsx;IA-PLAN IA-D1/D2):
 * 識別方塊=品牌符號「M」;頁籤圖示=Uniconsign 符號系統(儀表板/打字機/木/書,對應關係見
 * BrandIcons.tsx 檔頭)。窄螢幕(≤720px)收合慣例由既有 CSS class 負責。
 * 家族常駐切換(U2,IA-D7 ①)與文管庫 Sidebar.tsx 同位置、同樣式、同收合規則。
 */
import {
  APP_NAME,
  APP_TITLE,
  FAMILY_PEER_URL,
  FAMILY_VOICES_URL,
  INBOX_BADGE_LABEL,
  SIDEBAR_FAMILY_LINK,
  SIDEBAR_FAMILY_TITLE,
  SIDEBAR_IDENTITY_SUB,
  SIDEBAR_VOICES_LINK,
  SIDEBAR_VOICES_TITLE,
  TAB_LABELS,
} from '../constants';
import type { TabKey } from '../types';
import type { ReactNode } from 'react';
import { BrandMark, IconBook, IconDashboard, IconTree, IconTypewriter } from './BrandIcons';

const NAV_ITEMS: Array<{ key: TabKey; icon: ReactNode; label: string }> = [
  { key: 'dashboard', icon: <IconDashboard />, label: TAB_LABELS.dashboard },
  { key: 'media', icon: <IconTypewriter />, label: TAB_LABELS.media },
  { key: 'history', icon: <IconTree />, label: TAB_LABELS.history },
  { key: 'library', icon: <IconBook />, label: TAB_LABELS.library },
];

interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  /** 頁籤待處理數徽章(目前僅媒庫=收件匣待取用數;0 不顯示)。 */
  badges?: Partial<Record<TabKey, number>>;
}

export default function Sidebar({ activeTab, onTabChange, badges = {} }: SidebarProps) {
  return (
    <div className="app-sidebar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 24px 8px' }}>
        <BrandMark size={36} />
        <div className="sidebar-brand-text t-card-title">{APP_TITLE}</div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }} aria-label="主導覽">
        {NAV_ITEMS.map((item) => {
          const active = item.key === activeTab;
          const badge = badges[item.key] ?? 0;
          return (
            <button
              key={item.key}
              type="button"
              className="nav-btn t-body"
              onClick={() => onTabChange(item.key)}
              aria-current={active ? 'page' : undefined}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 10,
                textAlign: 'left',
                fontWeight: active ? 'var(--weight-bold)' : 'var(--weight-medium)',
                color: active ? 'var(--brand)' : 'var(--text-sub)',
                background: active ? 'var(--pill-brand-bg)' : 'transparent',
              }}
            >
              <span className="t-emoji" aria-hidden="true">
                {item.icon}
              </span>
              <span className="nav-label">{item.label}</span>
              {badge > 0 && (
                // 絕對定位在按鈕右上:≤720px 只剩圖示時也看得到、不擠歪置中的圖示
                <span
                  aria-label={INBOX_BADGE_LABEL(badge)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 6,
                    minWidth: 18,
                    height: 18,
                    padding: '0 5px',
                    borderRadius: 9,
                    background: 'var(--brand-fill)',
                    color: 'var(--on-brand-fill)', // 深色模式翻深字(Uniconsign 規範),對比由稽核案例守門
                    fontSize: 'var(--text-meta)',
                    fontWeight: 'var(--weight-bold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {badge}
                </span>
              )}
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
        <BrandMark size={34} />
        <div>
          <div className="t-sec-title">{APP_NAME}</div>
          <div className="t-meta" style={{ color: 'var(--text-weak)' }}>
            {SIDEBAR_IDENTITY_SUB}
          </div>
        </div>
      </div>

      {/*
        U2 家族常駐切換(IA-D7 ①):文管庫側欄有同位置、同樣式的「媒管庫 ↗」,兩邊文案一致。
        刻意放在識別塊**外面**——`.sidebar-footer` 在 ≤720px 整塊 display:none,連結若放在
        裡面,窄螢幕就沒有入口可按。沿用 `.nav-label` 收合慣例:窄螢幕只留圖示(靠 title 提示)。
        深層串接(交接/排程摘要)在媒庫 Library。
        2026-11-20 三方互連:加第二條「聲管庫 ↗」——與聲管庫尚無契約,純導覽。
      */}
      <a
        className="nav-btn sidebar-family-link t-sub"
        href={FAMILY_PEER_URL}
        target="_blank"
        rel="noopener noreferrer"
        title={SIDEBAR_FAMILY_TITLE}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 10,
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--brand)',
          textDecoration: 'none',
        }}
      >
        <span className="t-emoji" aria-hidden="true">
          ✍️
        </span>
        <span className="nav-label">{SIDEBAR_FAMILY_LINK}</span>
      </a>
      <a
        className="nav-btn sidebar-family-link t-sub"
        href={FAMILY_VOICES_URL}
        target="_blank"
        rel="noopener noreferrer"
        title={SIDEBAR_VOICES_TITLE}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 10,
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--brand)',
          textDecoration: 'none',
        }}
      >
        <span className="t-emoji" aria-hidden="true">
          🎤
        </span>
        <span className="nav-label">{SIDEBAR_VOICES_LINK}</span>
      </a>
    </div>
  );
}
