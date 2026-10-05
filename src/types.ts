/**
 * 媒體類型:audio 目前無主流社群平台可發佈(M-PLAN §2 查證),
 * 保留獨立 kind 供 UI 誠實標示,不與「無法辨識」混為一談。
 */
export type MediaKind = 'image' | 'video' | 'audio' | 'other';

/** 平台支援表列(M0 顯示層;內容為 M-PLAN §2 查證結論,動手前仍須複查當下文件)。 */
export interface PlatformSupportRow {
  platform: string;
  capability: string;
  schedule: string;
  phase: string;
}
