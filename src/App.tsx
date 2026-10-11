/**
 * 編輯器主頁(M1「附件為主、說明為輔」IA):
 * 媒體附件 → 說明 → 發佈(連線/排程/進度)→ 發佈歷史(metadata)。
 * 媒體檔僅存瀏覽器記憶體(預覽用 URL.createObjectURL,替換/卸載即 revoke);
 * localStorage 僅存發佈歷史 metadata。
 */
import { useEffect, useRef, useState } from 'react';
import HistoryCard from './components/HistoryCard';
import MediaPicker from './components/MediaPicker';
import PublishPanel from './components/PublishPanel';
import {
  APP_NAME,
  APP_TAGLINE,
  APP_TITLE,
  FB_ERROR_COPY,
  NOTICE_HISTORY_NOT_SAVED,
  NOTICE_PUBLISHED,
  NOTICE_SCHEDULED,
} from './constants';
import { useFacebook } from './hooks/useFacebook';
import { addRecord, clearHistory, loadHistory } from './services/history';
import type { PublishRecord } from './services/history';
import { detectMediaKind } from './utils/mediaKind';
import { formatDateTime } from './utils/format';

export default function App() {
  const fb = useFacebook();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [mode, setMode] = useState<'now' | 'schedule'>('now');
  const [scheduleValue, setScheduleValue] = useState('');
  const [records, setRecords] = useState<PublishRecord[]>(() => loadHistory());
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);

  // 卸載時釋放預覽 URL
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const showNotice = (text: string) => {
    setNotice(text);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 6000);
  };

  const pickFile = (picked: File) => {
    setNotice(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(picked);
    const kind = detectMediaKind(picked.type, picked.name);
    setPreviewUrl(kind === 'image' || kind === 'video' ? URL.createObjectURL(picked) : null);
  };

  const removeFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
  };

  const scheduleAtMs =
    mode === 'schedule' && scheduleValue ? new Date(scheduleValue).getTime() : null;

  const handlePublish = async () => {
    if (!file) return;
    let outcome: Awaited<ReturnType<typeof fb.publish>>;
    try {
      outcome = await fb.publish({ file, caption, scheduledAtMs: scheduleAtMs });
    } catch {
      // 錯誤已由 hook 寫入 fb.error,面板顯示對應文案
      return;
    }
    // 以下為發佈成功後的記帳——不在 try 內:任何記帳問題都不得遮蔽「已發佈」結果
    // (曾經的缺陷:歷史寫入配額滿拋錯被上方 catch 吞掉,畫面無反應→使用者重按→重複發佈)
    const record: PublishRecord = {
      id: crypto.randomUUID(),
      platform: 'facebook',
      mode,
      mediaName: file.name,
      mediaKind: outcome.kind,
      mediaSize: file.size,
      caption,
      createdAt: Date.now(),
      scheduledFor: mode === 'schedule' ? scheduleAtMs : null,
      postId: outcome.postId ?? outcome.videoId ?? outcome.photoId ?? null,
    };
    const { records: nextRecords, saveFailed } = addRecord(record);
    setRecords(nextRecords);
    const doneText =
      mode === 'schedule' ? `${NOTICE_SCHEDULED}:${formatDateTime(scheduleAtMs)}` : NOTICE_PUBLISHED;
    showNotice(saveFailed ? `${doneText}${NOTICE_HISTORY_NOT_SAVED}` : doneText);
    removeFile();
    setCaption('');
    setMode('now');
    setScheduleValue('');
  };

  const errorText = fb.error
    ? fb.error.code === 'api'
      ? `${FB_ERROR_COPY.api}:${fb.error.message}`
      : FB_ERROR_COPY[fb.error.code]
    : null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <main
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: '48px 24px 56px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
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

        {notice && (
          <div role="status" className="card" style={{ padding: '12px 16px', fontSize: 13.5, color: 'var(--brand)', fontWeight: 700 }}>
            {notice}
          </div>
        )}

        <MediaPicker
          file={file}
          previewUrl={previewUrl}
          onPick={pickFile}
          onRemove={removeFile}
          caption={caption}
          onCaptionChange={setCaption}
        />

        <PublishPanel
          status={fb.status}
          errorText={errorText}
          pages={fb.pages}
          selectedPageId={fb.selectedPageId}
          onSelectPage={fb.selectPage}
          connecting={fb.connecting}
          publishing={fb.publishing}
          progress={fb.progress}
          hasMedia={!!file}
          mode={mode}
          onModeChange={setMode}
          scheduleValue={scheduleValue}
          onScheduleValueChange={setScheduleValue}
          onConnect={fb.connect}
          onDisconnect={fb.disconnect}
          onPublish={handlePublish}
        />

        <HistoryCard
          records={records}
          onClear={() => {
            clearHistory();
            setRecords([]);
          }}
        />
      </main>
    </div>
  );
}
