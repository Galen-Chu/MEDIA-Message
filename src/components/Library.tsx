/**
 * 媒庫頁(U1 首版,IA-D6 紅線:媒庫只存文字素材,媒體檔絕不落地)。
 * 說明素材=本機 localStorage 文字範本(儲存編發器目前的說明、一鍵套用回去),
 * 家族卡=前往文管庫的切換入口;說明交接/排程摘要(家族串接 L1/L2)屬 U3 起期次。
 */
import { useState } from 'react';
import {
  LIB_FAMILY_HEADING,
  LIB_FAMILY_HINT,
  LIB_FAMILY_LINK,
  LIB_FAMILY_URL,
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
import { deleteTemplate, loadTemplates, saveTemplate, type CaptionTemplate } from '../services/library';
import { formatDateTime } from '../utils/format';

interface LibraryPageProps {
  /** 編發器目前的說明(存 App 層——切頁籤不遺失)。 */
  caption: string;
  /** 套用素材:由 App 附加到說明並帶往編發器。 */
  onApply: (text: string) => void;
  onNotice: (text: string) => void;
}

export default function LibraryPage({ caption, onApply, onNotice }: LibraryPageProps) {
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

  const captionEmpty = !caption.trim();

  return (
    <div style={{ maxWidth: 1080, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: 'var(--text-main)' }}>
          {TAB_LABELS.library}
        </h1>
      </header>

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
          href={LIB_FAMILY_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', display: 'inline-block' }}
        >
          {LIB_FAMILY_LINK}
        </a>
        <p style={{ margin: '14px 0 0', fontSize: 11.5, color: 'var(--text-faint)', lineHeight: 1.7 }}>
          {LIB_FUTURE_NOTE}
        </p>
      </section>
    </div>
  );
}
