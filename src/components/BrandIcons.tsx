/**
 * 品牌圖像(來源=個人品牌設計系統 Uniconsign,galen-chu/uniconsign)。
 * BrandMark=品牌符號字母版「M」(綠底+青圓+白字母+黃點,SVG 造型逐字複製自
 * icons/brand/logo-m.svg,僅補 React 屬性與唯一 clipPath id)。
 * 導覽符號=Uniconsign 符號系統(fill 改 currentColor 跟隨文字色,造型逐字複製):
 * 儀表板(science/dashboard)=媒管 Dashboard、打字機(science/typewriter)=編發器 Media、
 * 木(dao/tree)=發佈史(年輪=累積的紀錄)、書(science/book,原 law/book 遷入)=媒庫。
 * (產生方式:scripts 外臨時產生器,幾何逐字取自原始 SVG。)
 */
import { useId, type ReactNode } from 'react';

export function BrandMark({ size = 36, title }: { size?: number; title?: string }) {
  const clipId = `brand-m-${useId()}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <clipPath id={clipId}>
          <rect width="32" height="32" rx="8" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="32" height="32" fill="#167839" />
        <circle cx="22" cy="10" r="10" fill="#009CAD" />
        <path d="M8 23V9L14 17.5L20 9V23" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="25" cy="25" r="2.5" fill="#E7D24E" />
      </g>
    </svg>
  );
}

/** 符號系統共用骨架:24×24、currentColor、裝飾性(aria-hidden)、與文字基線對齊。 */
function NavIcon({ size = 18, children }: { size?: number; children: ReactNode }): ReactNode {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      style={{ display: 'inline-block', verticalAlign: '-0.18em' }}
    >
      {children}
    </svg>
  );
}

/** 科學「書」——媒庫 Library。 */
export function IconBook({ size = 18 }: { size?: number }): ReactNode {
  return (
    <NavIcon size={size}>
      <path d="M11.4 7.3L11.08 7.07L10.74 6.86L10.4 6.67L10 6.47L9.59 6.3L9.12 6.13L8.6 5.98L8.02 5.84L7.34 5.72L6.5 5.61L5.35 5.53L4 5.5A1 1 0 0 1 4 3.5L4 3.5L5.44 3.53L6.7 3.62L7.64 3.74L8.43 3.88L9.11 4.05L9.74 4.23L10.31 4.43L10.82 4.65L11.33 4.89L11.76 5.14L12.19 5.41L12.6 5.7A1 1 0 0 1 11.4 7.3ZM5 4.5L5 17.5A1 1 0 0 1 3 17.5L3 17.5L3 4.5A1 1 0 0 1 5 4.5ZM4 16.5L5.65 16.54L6.8 16.63L7.75 16.76L8.54 16.91L9.22 17.07L9.85 17.27L10.42 17.48L10.93 17.7L11.42 17.95L11.86 18.2L12.28 18.47L12.6 18.7A1 1 0 0 1 11.4 20.3L11.4 20.3L11.15 20.12L10.82 19.9L10.47 19.71L10.08 19.51L9.67 19.33L9.21 19.16L8.69 19L8.11 18.86L7.43 18.73L6.59 18.62L5.55 18.54L4 18.5A1 1 0 0 1 4 16.5ZM11.4 18.7L11.81 18.41L12.24 18.14L12.67 17.89L13.18 17.65L13.69 17.43L14.26 17.23L14.89 17.05L15.57 16.88L16.36 16.74L17.3 16.62L18.55 16.53L20 16.5A1 1 0 0 1 20 18.5L20 18.5L18.65 18.53L17.5 18.61L16.66 18.72L15.98 18.84L15.4 18.98L14.88 19.13L14.41 19.3L14 19.47L13.6 19.67L13.26 19.86L12.92 20.07L12.6 20.3A1 1 0 0 1 11.4 18.7ZM19 17.5L19 4.5A1 1 0 0 1 21 4.5L21 4.5L21 17.5A1 1 0 0 1 19 17.5ZM20 5.5L18.45 5.54L17.41 5.62L16.57 5.73L15.89 5.86L15.31 6L14.79 6.16L14.33 6.33L13.92 6.51L13.53 6.71L13.18 6.9L12.85 7.12L12.6 7.3A1 1 0 0 1 11.4 5.7L11.4 5.7L11.72 5.47L12.14 5.2L12.58 4.95L13.07 4.7L13.58 4.48L14.15 4.27L14.78 4.07L15.46 3.91L16.25 3.76L17.2 3.63L18.35 3.54L20 3.5A1 1 0 0 1 20 5.5Z" fill="currentColor"/>
      <path d="M13 6.5L13 19.5A1 1 0 0 1 11 19.5L11 19.5L11 6.5A1 1 0 0 1 13 6.5Z" fill="currentColor"/>
    </NavIcon>
  );
}
/** 道家「木」——發佈史 History(年輪=累積的紀錄)。 */
export function IconTree({ size = 18 }: { size?: number }): ReactNode {
  return (
    <NavIcon size={size}>
      <path d="M12.79 4.12L7.29 11.12A1 1 0 0 1 5.71 9.88L5.71 9.88L11.21 2.88A1 1 0 0 1 12.79 4.12ZM6.5 9.5L9 9.5A1 1 0 0 1 9 11.5L9 11.5L6.5 11.5A1 1 0 0 1 6.5 9.5ZM9.81 11.09L5.81 16.59A1 1 0 0 1 4.19 15.41L4.19 15.41L8.19 9.91A1 1 0 0 1 9.81 11.09ZM5 15L19 15A1 1 0 0 1 19 17L19 17L5 17A1 1 0 0 1 5 15ZM18.19 16.59L14.19 11.09A1 1 0 0 1 15.81 9.91L15.81 9.91L19.81 15.41A1 1 0 0 1 18.19 16.59ZM15 9.5L17.5 9.5A1 1 0 0 1 17.5 11.5L17.5 11.5L15 11.5A1 1 0 0 1 15 9.5ZM16.71 11.12L11.21 4.12A1 1 0 0 1 12.79 2.88L12.79 2.88L18.29 9.88A1 1 0 0 1 16.71 11.12Z" fill="currentColor"/>
      <path d="M13 16L13 20.5A1 1 0 0 1 11 20.5L11 20.5L11 16A1 1 0 0 1 13 16Z" fill="currentColor"/>
    </NavIcon>
  );
}
/** 科學「儀表板」——媒管 Dashboard(每日總覽)。 */
export function IconDashboard({ size = 18 }: { size?: number }): ReactNode {
  return (
    <NavIcon size={size}>
      <path d="M5.64 18.36A9 9 0 1 1 18.36 18.36A1 1 0 0 1 16.95 16.95A7 7 0 1 0 7.05 16.95A1 1 0 0 0 5.64 18.36Z" fill="currentColor"/>
      <rect x="11" y="3.4" width="2" height="2.6" rx="1" fill="currentColor"/>
      <rect x="11.7" y="5.79" width="2" height="9.99" rx="1" transform="rotate(30 12.7 10.79)" fill="currentColor"/>
      <circle cx="12" cy="12" r="1.6" fill="currentColor"/>
    </NavIcon>
  );
}
/** 科學「打字機」——編發器 Media。 */
export function IconTypewriter({ size = 18 }: { size?: number }): ReactNode {
  return (
    <NavIcon size={size}>
      <path d="M9.5 2.5H14.5Q16.5 2.5 16.5 4.5V7.5Q16.5 9.5 14.5 9.5H9.5Q7.5 9.5 7.5 7.5V4.5Q7.5 2.5 9.5 2.5Z M9.5 4.5V7.5H14.5V4.5Z" fill="currentColor"/>
      <rect x="9.3" y="5.3" width="5.4" height="1.4" rx="0.7" fill="currentColor"/>
      <path d="M5 10H19Q21 10 21 12V15Q21 17 19 17H5Q3 17 3 15V12Q3 10 5 10Z M5 12V15H19V12Z" fill="currentColor"/>
      <circle cx="7.5" cy="13.5" r="0.9" fill="currentColor"/>
      <circle cx="12" cy="13.5" r="0.9" fill="currentColor"/>
      <circle cx="16.5" cy="13.5" r="0.9" fill="currentColor"/>
    </NavIcon>
  );
}
