/** 媒體附件卡:編輯器的第一公民——選檔、預覽、類型/大小標示(檔案僅記憶體,預覽用 URL.createObjectURL)。 */
import {
  AUDIO_KIND_HINT,
  CAPTION_HEADING,
  CAPTION_HINT,
  CAPTION_PLACEHOLDER,
  MEDIA_HEADING,
  MEDIA_KIND_LABEL,
  MEDIA_PICK,
  MEDIA_REMOVE,
  MEDIA_RULES,
} from '../constants';
import { formatBytes } from '../utils/format';
import { detectMediaKind } from '../utils/mediaKind';
import type { MediaKind } from '../types';

const ACCEPT = 'image/jpeg,image/png,image/gif,image/bmp,image/tiff,video/*';

interface MediaPickerProps {
  file: File | null;
  previewUrl: string | null;
  onPick: (file: File) => void;
  onRemove: () => void;
  caption: string;
  onCaptionChange: (value: string) => void;
}

export default function MediaPicker({
  file,
  previewUrl,
  onPick,
  onRemove,
  caption,
  onCaptionChange,
}: MediaPickerProps) {
  const kind: MediaKind | null = file ? detectMediaKind(file.type, file.name) : null;

  return (
    <>
      <section className="card" style={{ padding: 24 }} aria-labelledby="media-heading">
        <h2 id="media-heading" style={{ margin: '0 0 10px', fontSize: 16, color: 'var(--text-main)' }}>
          {MEDIA_HEADING}
        </h2>
        <ul style={{ listStyle: 'none', margin: '0 0 14px', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {MEDIA_RULES.map((rule) => (
            <li key={rule} style={{ fontSize: 12.5, color: 'var(--text-weak)' }}>
              · {rule}
            </li>
          ))}
        </ul>
        {file && kind ? (
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {previewUrl && kind === 'image' && (
              <img
                src={previewUrl}
                alt={file.name}
                style={{ maxWidth: 220, maxHeight: 160, borderRadius: 10, border: '1px solid var(--border-3)' }}
              />
            )}
            {previewUrl && kind === 'video' && (
              <video src={previewUrl} controls style={{ maxWidth: 260, maxHeight: 160, borderRadius: 10 }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 180, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="pill pill-purple">{MEDIA_KIND_LABEL[kind]}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', wordBreak: 'break-all' }}>
                  {file.name}
                </span>
              </div>
              <span style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>{formatBytes(file.size)}</span>
              {kind === 'audio' && (
                <span style={{ fontSize: 12.5, color: 'var(--accent)' }}>{AUDIO_KIND_HINT}</span>
              )}
              <div>
                <button type="button" className="btn btn-outline" onClick={onRemove}>
                  {MEDIA_REMOVE}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <label
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px dashed var(--border-3)',
              cursor: 'pointer',
            }}
          >
            {MEDIA_PICK}
            <input
              type="file"
              accept={ACCEPT}
              style={{ display: 'none' }}
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) onPick(picked);
                e.target.value = ''; // 允許重選同名檔
              }}
            />
          </label>
        )}
      </section>

      <section className="card" style={{ padding: 24 }} aria-labelledby="caption-heading">
        <h2 id="caption-heading" style={{ margin: '0 0 4px', fontSize: 15, color: 'var(--text-sub)' }}>
          {CAPTION_HEADING}
        </h2>
        <p style={{ margin: '0 0 10px', fontSize: 12.5, color: 'var(--text-weak)' }}>{CAPTION_HINT}</p>
        <textarea
          className="text-input"
          rows={3}
          value={caption}
          placeholder={CAPTION_PLACEHOLDER}
          onChange={(e) => onCaptionChange(e.target.value)}
        />
      </section>
    </>
  );
}
