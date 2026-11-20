/**
 * AI 看圖生說明(M-PLAN D8 一期):說明卡內的 AI 操作列 + 金鑰設定 Modal + 結果 Modal。
 * BYOK 慣例鏡像文管庫:無金鑰顯示按鈕但點擊僅提示(D5);金鑰來源可選
 * 本機或唯讀文管庫(IA-D8,勾選式+來源標示);生成結果可編輯、標籤 chips
 * 勾選後附加於說明結尾(人審後才進說明欄,不直接覆寫)。
 * 誠實標示:圖片直送 Google Gemini API(使用你的金鑰)、本站不留存、
 * 兩產品同一份配額——文案集中 constants.ts。
 */
import { useEffect, useState } from 'react';
import {
  AI_ERROR_COPY,
  AI_GENERATE_BTN,
  AI_GENERATING,
  AI_KEY_BTN,
  AI_KEY_CLEAR,
  AI_KEY_CLEARED_NOTICE,
  AI_KEY_CLOSE,
  AI_KEY_MODAL_TITLE,
  AI_KEY_NOTES,
  AI_KEY_OWN_LABEL,
  AI_KEY_OWN_PLACEHOLDER,
  AI_KEY_PEER_CHECK,
  AI_KEY_PEER_DETECTED,
  AI_KEY_PEER_MISSING,
  AI_KEY_SAVED_NOTICE,
  AI_KEY_SAVE,
  AI_KEY_SOURCE_NONE,
  AI_KEY_SOURCE_OWN,
  AI_KEY_SOURCE_PEER,
  AI_NEED_IMAGE,
  AI_NO_KEY,
  AI_RESULT_APPLIED_NOTICE,
  AI_RESULT_APPLY,
  AI_RESULT_CLOSE,
  AI_RESULT_COPY,
  AI_RESULT_COPIED_NOTICE,
  AI_RESULT_COPY_FAILED,
  AI_RESULT_TAGS_LABEL,
  AI_RESULT_TITLE,
  AI_STOP_BTN,
} from '../constants';
import { useMediaAi } from '../hooks/useMediaAi';
import {
  clearOwnKey,
  getKeySource,
  loadOwnKey,
  loadPeerKey,
  saveOwnKey,
  setKeySource,
} from '../services/gemini/keyStore';
import type { MediaKind } from '../types';

interface AiCaptionProps {
  file: File | null;
  kind: MediaKind | null;
  /** 帶入說明=直接覆寫說明欄(結果 Modal 中可編輯後才帶入,人審窗口)。 */
  onApplyCaption: (text: string) => void;
  onNotice: (text: string) => void;
}

interface KeyInfo {
  source: 'own' | 'peer';
  ownKey: string;
  peerKey: string;
}

function readKeyInfo(): KeyInfo {
  return { source: getKeySource(), ownKey: loadOwnKey(), peerKey: loadPeerKey() };
}

export default function AiCaption({ file, kind, onApplyCaption, onNotice }: AiCaptionProps) {
  const ai = useMediaAi();
  const busy = ai.state.phase === 'busy';

  const [keyInfo, setKeyInfo] = useState<KeyInfo>(readKeyInfo);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [ownDraft, setOwnDraft] = useState('');

  const [resultOpen, setResultOpen] = useState(false);
  const [resultCaption, setResultCaption] = useState('');
  const [resultTags, setResultTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Esc 關閉開啟中的 Modal(家族 ConfirmModal 慣例)
  useEffect(() => {
    if (!keyModalOpen && !resultOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setKeyModalOpen(false);
        setResultOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keyModalOpen, resultOpen]);

  const refreshKeyInfo = () => setKeyInfo(readKeyInfo());

  const openKeyModal = () => {
    setOwnDraft(loadOwnKey());
    refreshKeyInfo();
    setKeyModalOpen(true);
  };

  const handleGenerate = async () => {
    if (busy) return;
    if (!file || !kind) {
      onNotice(AI_NEED_IMAGE);
      return;
    }
    if (kind !== 'image') {
      onNotice(AI_ERROR_COPY.unsupported_kind);
      return;
    }
    const active = readKeyInfo();
    const activeKey = active.source === 'peer' ? active.peerKey : active.ownKey;
    if (!activeKey) {
      refreshKeyInfo();
      openKeyModal();
      onNotice(AI_NO_KEY);
      return;
    }
    const outcome = await ai.generate(file);
    if (outcome.ok) {
      setResultCaption(outcome.result.caption);
      setResultTags(outcome.result.tags);
      setSelectedTags(outcome.result.tags);
      setResultOpen(true);
    } else {
      onNotice(AI_ERROR_COPY[outcome.code]);
    }
  };

  const saveOwn = () => {
    const v = ownDraft.trim();
    if (!v) return;
    saveOwnKey(v);
    setKeyInfo(readKeyInfo());
    onNotice(AI_KEY_SAVED_NOTICE);
  };

  const clearOwn = () => {
    clearOwnKey();
    setOwnDraft('');
    setKeyInfo(readKeyInfo());
    onNotice(AI_KEY_CLEARED_NOTICE);
  };

  const toggleSource = (peer: boolean) => {
    setKeySource(peer ? 'peer' : 'own');
    setKeyInfo(readKeyInfo());
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const composedText = () => {
    const body = resultCaption.trim();
    return selectedTags.length ? `${body}\n\n${selectedTags.join(' ')}` : body;
  };

  const applyResult = () => {
    onApplyCaption(composedText());
    setResultOpen(false);
    onNotice(AI_RESULT_APPLIED_NOTICE);
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(composedText());
      onNotice(AI_RESULT_COPIED_NOTICE);
    } catch {
      onNotice(AI_RESULT_COPY_FAILED);
    }
  };

  const keyStatusText = keyInfo.source === 'peer'
    ? keyInfo.peerKey
      ? AI_KEY_SOURCE_PEER
      : AI_KEY_SOURCE_NONE
    : keyInfo.ownKey
      ? AI_KEY_SOURCE_OWN
      : AI_KEY_SOURCE_NONE;

  return (
    <>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
        <button type="button" className="btn btn-outline btn-sm" onClick={handleGenerate} disabled={busy}>
          {busy ? AI_GENERATING : AI_GENERATE_BTN}
        </button>
        {busy && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={ai.stop}>
            {AI_STOP_BTN}
          </button>
        )}
        <button type="button" className="btn btn-ghost btn-sm" onClick={openKeyModal}>
          {AI_KEY_BTN}
        </button>
        <span className="t-meta">{keyStatusText}</span>
      </div>

      {keyModalOpen && (
        <div className="modal-overlay" role="presentation" onClick={() => setKeyModalOpen(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label={AI_KEY_MODAL_TITLE}
            onClick={(e) => e.stopPropagation()}
            style={{ padding: 20, maxWidth: 440 }}
          >
            <div className="t-card-title" style={{ marginBottom: 12 }}>{AI_KEY_MODAL_TITLE}</div>

            <label className="t-sec-title" style={{ display: 'block', marginBottom: 6 }}>
              {AI_KEY_OWN_LABEL}
            </label>
            <input
              className="text-input"
              value={ownDraft}
              placeholder={AI_KEY_OWN_PLACEHOLDER}
              onChange={(e) => setOwnDraft(e.target.value)}
              aria-label={AI_KEY_OWN_LABEL}
              style={{ marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={saveOwn} disabled={!ownDraft.trim()}>
                {AI_KEY_SAVE}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearOwn} disabled={!keyInfo.ownKey}>
                {AI_KEY_CLEAR}
              </button>
            </div>

            <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 6 }}>
              <input
                type="checkbox"
                checked={keyInfo.source === 'peer'}
                onChange={(e) => toggleSource(e.target.checked)}
                style={{ marginTop: 3 }}
              />
              <span className="t-body">{AI_KEY_PEER_CHECK}</span>
            </label>
            <div className="t-sub" style={{ marginBottom: 14 }}>
              {keyInfo.peerKey ? `✓ ${AI_KEY_PEER_DETECTED}` : AI_KEY_PEER_MISSING}
            </div>

            <ul className="t-note" style={{ listStyle: 'none', margin: '0 0 16px', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {AI_KEY_NOTES.map((note) => (
                <li key={note}>· {note}</li>
              ))}
            </ul>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setKeyModalOpen(false)}>
                {AI_KEY_CLOSE}
              </button>
            </div>
          </div>
        </div>
      )}

      {resultOpen && (
        <div className="modal-overlay" role="presentation" onClick={() => setResultOpen(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-label={AI_RESULT_TITLE}
            onClick={(e) => e.stopPropagation()}
            style={{ padding: 20, maxWidth: 480 }}
          >
            <div className="t-card-title" style={{ marginBottom: 10 }}>{AI_RESULT_TITLE}</div>
            <textarea
              className="text-input"
              rows={6}
              value={resultCaption}
              onChange={(e) => setResultCaption(e.target.value)}
              aria-label={AI_RESULT_TITLE}
              style={{ marginBottom: 12 }}
            />
            {resultTags.length > 0 && (
              <>
                <div className="t-sec-title" style={{ marginBottom: 6 }}>{AI_RESULT_TAGS_LABEL}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {resultTags.map((tag) => {
                    const on = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        className="pill"
                        aria-pressed={on}
                        onClick={() => toggleTag(tag)}
                        style={{
                          cursor: 'pointer',
                          border: on ? '1px solid var(--brand)' : '1px solid var(--border-2)',
                          background: on ? 'var(--pill-brand-bg)' : 'var(--surface-soft)',
                          color: 'var(--text-main)',
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            <ul className="t-note" style={{ listStyle: 'none', margin: '0 0 14px', padding: 0 }}>
              <li>· {AI_KEY_NOTES[3]}</li>
            </ul>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setResultOpen(false)}>
                {AI_RESULT_CLOSE}
              </button>
              <button type="button" className="btn btn-outline" onClick={copyResult}>
                {AI_RESULT_COPY}
              </button>
              <button type="button" className="btn btn-primary" onClick={applyResult}>
                {AI_RESULT_APPLY}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
