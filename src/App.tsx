/**
 * 版面殼層(U1:側欄四頁籤,docs/IA-PLAN.md IA-D1/D2,結構複製文管庫):
 * 🏠媒管 Dashboard / 🎬編發器 Media / 📅發佈史 History / 🗂️媒庫 Library。
 * 編輯器狀態(file/previewUrl/caption/mode/scheduleValue)刻意留在 App 層——
 * 切頁籤不遺失選好的檔案與說明、上傳中切頁不中斷(IA-PLAN §3.3);狀態量小,不加全域 store。
 * activeTab 由 hash 初始化並聆聽 hashchange(#media 等深連結,IA-PLAN §3.2)。
 * 媒體檔僅存瀏覽器記憶體(預覽用 URL.createObjectURL,替換/卸載即 revoke);
 * localStorage 僅存發佈歷史 metadata 與媒庫說明素材(皆純文字)。
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Dashboard from './components/Dashboard';
import HistoryPage from './components/History';
import LibraryPage from './components/Library';
import MediaPicker from './components/MediaPicker';
import PublishPanel from './components/PublishPanel';
import Sidebar from './components/Sidebar';
import {
  FB_ERROR_COPY,
  FOOTER_NOTE,
  FOOTER_PLAN_TEXT,
  FOOTER_PLAN_URL,
  LIB_TEMPLATE_APPLIED_NOTICE,
  NOTICE_HISTORY_NOT_SAVED,
  NOTICE_PUBLISHED,
  NOTICE_SCHEDULED,
  TAB_LABELS,
} from './constants';
import { useFacebook } from './hooks/useFacebook';
import { addRecord, clearHistory, loadHistory } from './services/history';
import type { PublishRecord } from './services/history';
import type { TabKey } from './types';
import { detectMediaKind } from './utils/mediaKind';
import { formatDateTime } from './utils/format';

const TAB_KEYS: readonly TabKey[] = ['dashboard', 'media', 'history', 'library'];

/** hash → 頁籤(未知 hash 落 Dashboard;#media 深連結直達編發器)。 */
function tabFromHash(): TabKey {
  const hash = window.location.hash.replace(/^#/, '');
  return (TAB_KEYS as readonly string[]).includes(hash) ? (hash as TabKey) : 'dashboard';
}

export default function App() {
  const fb = useFacebook();

  const [tab, setTab] = useState<TabKey>(() => tabFromHash());
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [mode, setMode] = useState<'now' | 'schedule'>('now');
  const [scheduleValue, setScheduleValue] = useState('');
  const [records, setRecords] = useState<PublishRecord[]>(() => loadHistory());
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);

  // hash 深連結:外部(文管庫家族卡、書籤)以 #media 等開啟時切到對應頁籤
  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

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

  // 切頁籤:replaceState 更新 hash——不塞爆返回歷史,也不觸發自身的 hashchange 監聽
  const gotoTab = useCallback((next: TabKey) => {
    setTab(next);
    window.history.replaceState(null, '', `#${next}`);
  }, []);

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

  // 媒庫套用素材:附加到現有說明之後(不覆蓋已寫內容),並帶往編發器
  const applyTemplate = (text: string) => {
    setCaption((prev) => (prev.trim() ? `${prev.trimEnd()} ${text}` : text));
    gotoTab('media');
    showNotice(LIB_TEMPLATE_APPLIED_NOTICE);
  };

  const errorText = fb.error
    ? fb.error.code === 'api'
      ? `${FB_ERROR_COPY.api}:${fb.error.message}`
      : FB_ERROR_COPY[fb.error.code]
    : null;

  const selectedPage = fb.pages.find((p) => p.pageId === fb.selectedPageId) ?? null;

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', background: 'var(--bg)', overflow: 'hidden' }}>
      <Sidebar activeTab={tab} onTabChange={gotoTab} />
      <main className="app-main" style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {tab === 'dashboard' && (
          <Dashboard
            records={records}
            fbStatus={fb.status}
            pageName={selectedPage?.pageName ?? null}
            onStart={() => gotoTab('media')}
          />
        )}

        {tab === 'media' && (
          <div style={{ maxWidth: 1080, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <header>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: 'var(--text-main)' }}>
                {TAB_LABELS.media}
              </h1>
            </header>
            {/* 兩欄:左=媒體附件+說明/右=連線+排程+發佈;≤1024px 由 .draft-layout 斷點疊成單欄(IA-D2) */}
            <div className="draft-layout" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1.5, minWidth: 0 }}>
                <MediaPicker
                  file={file}
                  previewUrl={previewUrl}
                  onPick={pickFile}
                  onRemove={removeFile}
                  caption={caption}
                  onCaptionChange={setCaption}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, minWidth: 300 }}>
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
              </div>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <HistoryPage
            records={records}
            onClear={() => {
              clearHistory();
              setRecords([]);
            }}
          />
        )}

        {tab === 'library' && (
          <LibraryPage caption={caption} onApply={applyTemplate} onNotice={showNotice} />
        )}

        <footer
          style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.8, padding: '28px 0 8px' }}
        >
          <div>{FOOTER_NOTE}</div>
          <a href={FOOTER_PLAN_URL} target="_blank" rel="noreferrer" style={{ color: 'var(--brand)' }}>
            {FOOTER_PLAN_TEXT}
          </a>
        </footer>
      </main>

      {notice && (
        <div className="toast" role="status" aria-live="polite">
          {notice}
        </div>
      )}
    </div>
  );
}
