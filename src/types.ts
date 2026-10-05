/**
 * 媒體類型:audio 目前無主流社群平台可發佈(M-PLAN §2 查證),
 * 保留獨立 kind 供 UI 誠實標示,不與「無法辨識」混為一談。
 */
export type MediaKind = 'image' | 'video' | 'audio' | 'other';

/** 發佈模式:立即 or 平台原生排程(D4:排程一律平台原生)。 */
export type PublishMode = 'now' | 'schedule';
