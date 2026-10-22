/**
 * 媒庫頁(U1 首版,IA-D6 紅線:媒庫只存文字素材,媒體檔絕不落地)。
 * 說明素材=本機 localStorage 文字範本(儲存編發器目前的說明、一鍵套用回去),
 * 收件匣(U3,家族串接 L1)=文管庫「送至媒管庫」的文案,有待取用時置頂顯示;
 * 家族卡=前往文管庫的切換入口(收件匣空時在此說明用法);排程摘要(L2)屬 U4。
 */
import { useState } from 'react';
import {
  INBOX_APPLIED_NOTICE,
  INBOX_APPLY,
  INBOX_DISMISS,
  INBOX_DISMISS_CONFIRM,
  INBOX_DISMISSED_NOTICE,
  INBOX_EMPTY,
  INBOX_HEADING,
  INBOX_HINT,
  INBOX_REMOVE_FAILED,
  INBOX_SAVE,
  INBOX_SAVED_NOTICE,
  INBOX_SENT_AT,
  LIB_FAMILY_HEADING,
  LIB_FAMILY_HINT,
  LIB_FAMILY_LINK,
  FAMILY_PEER_URL,
  LIB_FUTURE_NOTE,
  LIB_TEMPLATE_APPLY,
  LIB_TEMPLATE_DELETE,
  LIB_TEMPLATE_DELETE_CONFIRM,
  LIB_TEMPLATE_EMPTY,
  LIB_TEMPLATE_HEADING,
  LIB_TEMPLATE_HINT,
  LIB_TEMPLATE_SAVE,
  LIB_TEMPLATE_SAVE_EMPTY_TITLE,
  LIB_TEMPLATE_SAVE_FAILED,
  LIB_TEMPLATE_SAVED_NOTICE,
  TAB_LABELS,
} from '../constants';
import { takeHandoff, type HandoffItem } from '../services/family/handoff';
import { deleteTemplate, loadTemplates, saveTemplate, type CaptionTemplate } from '../services/library';
import { formatDateTime } from '../utils/format';

interface LibraryPageProps {
  /** 編發器目前的說明(存 App 層——切頁籤不遺失)。 */
  caption: string;
  /** 套用素材/收件匣文案:由 App 附加到說明並帶往編發器(noticeText 省略=素材套用提示)。 */
  onApply: (text: string, noticeText?: string) => void;
  onNotice: (text: string) => void;
  /** 收件匣(to=媒管庫 的交接,最新在前;狀態在 App 層供側欄徽章共用)。 */
  inbox: HandoffItem[];
  onInboxChange: (inbox: HandoffItem[]) => void;
}

export default function LibraryPage({ caption, onApply, onNotice, inbox, onInboxChange }: LibraryPageProps) {
  const [templates, setTemplates] = useState<CaptionTemplate[]>(() => loadTemplates());

  const handleSave = () => {
    const { templates: next, saveFailed } = saveTemplate(caption);
    setTemplates(next);
    onNotice(
      saveFailed ? `${LIB_TEMPLATE_SAVED_NOTICE}${LIB_TEMPLATE_SAVE_FAILED}` : LIB_TEMPLATE_SAVED_NOTICE,
    );
  };

  const handleDelete = (id: string) => {
    if (!window.confirm(LIB_TEMPLATE_DELETE_CONFIRM)) return;
    setTemplates(deleteTemplate(id));
  };

  /** 從佇列移除該筆(取用前重新讀取,見 takeHandoff);回傳提示尾句(寫回失敗時誠實告知)。 */
  const takeFromInbox = (id: string): { item: HandoffItem | null; suffix: string } => {
    const result = takeHandoff(id);
    onInboxChange(result.inbox);
    return { item: result.item, suffix: result.removeFailed ? INBOX_REMOVE_FAILED : '' };
  };

  const handleInboxApply = (id: string) => {
    const { item, suffix } = takeFromInbox(id);
    if (item) onApply(item.text, `${INBOX_APPLIED_NOTICE}${suffix}`);
  };

  // 先存素材、成功才移出收件匣——存失敗(配額滿)時文案留在收件匣,不會兩頭落空
  const handleInboxSave = (entry: HandoffItem) => {
    const { templates: next, saveFailed } = saveTemplate(entry.text);
    setTemplates(next);
    if (saveFailed) {
      onNotice(`${INBOX_SAVED_NOTICE}${LIB_TEMPLATE_SAVE_FAILED}`);
      return;
    }
    const { suffix } = takeFromInbox(entry.id);
    onNotice(`${INBOX_SAVED_NOTICE}${suffix}`);
  };

  const handleInboxDismiss = (id: string) => {
    if (!window.confirm(INBOX_DISMISS_CONFIRM)) return;
    const { item, suffix } = takeFromInbox(id);
    if (item) onNotice(`${INBOX_DISMISSED_NOTICE}${suffix}`);
  };

  const captionEmpty = !caption.trim();

  return (
    <div style={{ maxWidth: 1080, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: 'var(--text-main)' }}>
          {TAB_LABELS.library}
        </h1>
      </header>

      {inbox.length > 0 && (
        <section id="handoff" className="card" style={{ padding: 24 }} aria-labelledby="lib-inbox-heading">
          <h2 id="lib-inbox-heading" style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--text-main)' }}>
            {INBOX_HEADING}({inbox.length})
          </h2>
          <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--text-weak)', lineHeight: 1.7 }}>
            {INBOX_HINT}
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {inbox.map((entry) => (
              <li
                key={entry.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  // 底色沿用說明素材清單(surface-soft,文字對比已稽核);左側品牌色細線區分來源
                  background: 'var(--surface-soft)',
                  borderLeft: '3px solid var(--brand-fill)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-faint)', flex: 1 }}>
                    {INBOX_SENT_AT(formatDateTime(entry.createdAt))}
                  </span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: 12, padding: '6px 12px' }}
                    onClick={() => handleInboxApply(entry.id)}
                  >
                    {INBOX_APPLY}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: 12, padding: '6px 12px' }}
                    onClick={() => handleInboxSave(entry)}
                  >
                    {INBOX_SAVE}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: 12, padding: '6px 12px', color: 'var(--error)' }}
                    onClick={() => handleInboxDismiss(entry.id)}
                  >
                    {INBOX_DISMISS}
                  </button>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-main)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {entry.text}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card" style={{ padding: 24 }} aria-labelledby="lib-template-heading">
        <h2 id="lib-template-heading" style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--text-main)' }}>
          {LIB_TEMPLATE_HEADING}
        </h2>
        <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--text-weak)' }}>{LIB_TEMPLATE_HINT}</p>
        <button
          type="button"
          className="btn btn-primary"
          disabled={captionEmpty}
          title={captionEmpty ? LIB_TEMPLATE_SAVE_EMPTY_TITLE : undefined}
          onClick={handleSave}
        >
          {LIB_TEMPLATE_SAVE}
        </button>

        {templates.length === 0 ? (
          <p style={{ margin: '16px 0 0', fontSize: 13, color: 'var(--text-sub)' }}>{LIB_TEMPLATE_EMPTY}</p>
        ) : (
          <ul
            style={{
              listStyle: 'none',
              margin: '16px 0 0',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {templates.map((t) => (
              <li
                key={t.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: 'var(--surface-soft)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-faint)', flex: 1 }}>
                    {formatDateTime(t.createdAt)}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ fontSize: 12, padding: '6px 12px' }}
                    onClick={() => onApply(t.text)}
                  >
                    {LIB_TEMPLATE_APPLY}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ fontSize: 12, padding: '6px 12px', color: 'var(--error)' }}
                    onClick={() => handleDelete(t.id)}
                  >
                    {LIB_TEMPLATE_DELETE}
                  </button>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-sub)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {t.text}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" style={{ padding: 24 }} aria-labelledby="lib-family-heading">
        <h2 id="lib-family-heading" style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--text-main)' }}>
          {LIB_FAMILY_HEADING}
        </h2>
        <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--text-weak)', lineHeight: 1.7 }}>
          {LIB_FAMILY_HINT}
        </p>
        <a
          className="btn btn-outline"
          href={FAMILY_PEER_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          {LIB_FAMILY_LINK}
        </a>
        {inbox.length === 0 && (
          <p style={{ margin: '14px 0 0', fontSize: 12.5, color: 'var(--text-sub)', lineHeight: 1.7 }}>
            {INBOX_EMPTY}
          </p>
        )}
        <p style={{ margin: '14px 0 0', fontSize: 11.5, color: 'var(--text-faint)', lineHeight: 1.7 }}>
          {LIB_FUTURE_NOTE}
        </p>
      </section>
    </div>
  );
}
