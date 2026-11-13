# 個人影片產出管線(Video Pipeline)規劃

2026-11-13 定案。**本檔=維護者個人本機工具的規劃,不是 MEDIA-Message 產品功能**(不入 M-PLAN 分期、零後端、不涉產品紅線);與產品的分工=管線在本機產出短片檔 → 人工挑選 → MEDIA-Message 發佈(M1 已上線)。起源=Atlas Cloud「影片 AI Agent」文章評估(概念可借、伺服器端堆疊不適用)+ 最小管線討論。

## 1. 定位與形態

- **輸入**:本機影片檔(任何長度;>10min 長片切短正是主場)。**輸出**:粗剪短片(附字幕)→ 人審 → MEDIA-Message 發佈。
- 四工位:**faster-whisper 轉錄(含時間戳)→ Claude 讀稿選段+寫說明 → FFmpeg 照時間戳粗剪與燒字幕 → 人核看**。精剪(轉場/調色/追臉構圖/動態字幕)刻意留在管線外,交剪輯軟體(剪映)工位。
- **CLI/無狀態形態(檔案進、檔案出)**:未來若需容器化或更大規模系統,直接重構不受形態限制(2026-11-13 維護者拍板)。

## 2. 決策記錄

- **D1 依賴=1 套開源專案+標準工具**(2026-11-13 GitHub API 實查):必備=faster-whisper(SYSTRAN,⭐26,706、持續推送、本機 Python 3.14 相容已驗證——引擎 ctranslate2 4.9.0 有 cp314 Windows wheel)+ FFmpeg(標準工具,scoop/靜態包);可選=auto-editor(去靜音粗剪,⭐5,864、活躍)或 WhisperX(字級時間戳/說話者分離,⭐25,239)二擇一。
- **D2 明確排除**:stable-ts(已 archived)、ClipsAI(2024-01 後未動)、「自動選精采片段」類現成專案(查證結論=無活躍高星者,選段由 Claude 讀轉錄稿承擔)、Atlas Cloud 類付費統一閘道、MCP server、文生影片。
- **D3 圖檔不進本管線**:圖片直傳/排程 MEDIA-Message M1 已驗收;AI 看圖寫說明屬 M-PLAN「媒體 AI 候選」範圍,與本管線互補不重疊。
- **D4 TTS/配音不塞本管線**:與 VOICES-Message 產品線一起規劃(M-PLAN 遠期本就記「音+封面→影片」)。
- **D5 繁中坑**:Whisper 系輸出偏簡體——initial_prompt 引導或後處理轉繁,實作時必處理。
- **D6 隱私紀律**:素材不出機器;選段僅送必要的文字段落給 API(同文管庫「素材只在生成當下進 prompt、用完即棄」)。
- **D7 嵌入式整合現階段只做檔案層鬆耦合**(評估見 §4)。

## 3. 情境覆蓋(2026-11-13 評估)

- **覆蓋**:影片任意長度選段粗剪、字幕生成與燒錄、音軌抽取、切段合併轉檔壓縮、混真人旁白(背景音樂 ducking 屬 +1 指令等級)。
- **部分(+1 套或交剪映)**:動態逐字字幕(交剪映)、去靜音(auto-editor)。
- **不覆蓋(刻意外包)**:追臉橫轉直、精剪特效、AI 配音(聲管庫線)、圖片變影片 slideshow。

## 4. 嵌入編輯應用程式:三個方向

| 方向 | 可行性 | 說明 |
| --- | --- | --- |
| 檔案層鬆耦合(現行採用) | ✅ 零工程 | 管線產出檔案 → 剪映/任何編輯器開啟精修 → MEDIA-Message 選檔發佈 |
| 管線驅動編輯器(腳本面) | ✅ 未來選項 | DaVinci Resolve 官方 Python/Lua 腳本 API(可收片段清單自動組時間軸)、MLT `melt`(Kdenlive/Shotcut 底層 CLI)、GIMP Script-Fu / Krita Python(圖片批次);動手前依串接紀律查當下文件 |
| 編輯器內嵌管線(外掛面) | ⚠️ 逐案評估 | 僅限有外掛/腳本系統者(Resolve/Premiere/GIMP/Krita);剪映(CapCut)封閉生態、無公開外掛 API——不可嵌,只能當人工精修工位 |
| 嵌入自家網頁產品(MEDIA-Message) | ⚠️ 遠期 | WebCodecs/ffmpeg.wasm 技術上存在;M-PLAN 2026-10-06 評估「影片 AI 編輯今日不實際」維持不變,屬「媒體 AI 候選」二期以後 |

## 5. 分期

- **P0(✅ 2026-11-13)**:安裝完成(faster-whisper 1.2.1 @ Python 3.14;FFmpeg=BtbN GPL 建置 @ `D:\tools\ffmpeg\root\bin`)+ SKILL.md 兩份(`~/.claude/skills/video-pipeline` 與 `audio-pipeline`,個人層級——機器路徑不入公開 repo;audio-pipeline 原名 voice-pipeline,2026-11-13 更名)。實測教訓:**PyAV 19 與 faster-whisper 1.2.1 不相容**(`metadata_errors` 參數已移除),transcribe.py 改為「.wav 標準庫/其餘 FFmpeg CLI→ndarray」解碼、不經 PyAV。
- **P1(機器煙霧測試 ✅ 2026-11-13;真實素材驗收待維護者)**:五步全鏈路以測試素材驗證(Windows 內建 TTS 合成 en/zh 語音→testsrc 影片→mp4 轉錄兩種解碼路徑→5.5s 精確剪切→字幕燒錄);繁中 `--zh-tw` 實證輸出維持繁體。「真實長片 → 短片 → MEDIA-Message 發佈」待維護者以實際素材走一遍即收。
- **P2**:偏好記憶(情境工程——選段品味/說明風格落地為可注入的設定)
- **P3(選配)**:auto-editor、Resolve 腳本面整合

## 6. 跨機重建包(SKILL.md 與 transcribe.py 全文快照)

維護者**跨多機使用**:skill 檔在個人層級 `~/.claude/skills/`(Windows=`C:\Users\<帳號>\.claude\skills\`),刻意不入 repo;本節=最新驗證形狀的**全文快照**,同步紀律=**改 skill 必同步本節**(單一權威:機器上的 skill 為執行層,本節為重建層)。

**新機重建步驟:**

1. Python 3.x + `python -m pip install faster-whisper`(PyAV 19 不相容問題已由腳本繞過,無須另處理)
2. FFmpeg:choco/scoop/BtbN 靜態包任一——上 PATH 即可;或解至 `D:\tools\ffmpeg\`(transcribe.py 先查 PATH、再 fallback `D:/tools/ffmpeg/root/bin/ffmpeg.exe`)
3. 建兩個 skill 目錄與三個檔案:`~/.claude/skills/video-pipeline/SKILL.md`、`~/.claude/skills/video-pipeline/scripts/transcribe.py`(全文依下)、`~/.claude/skills/audio-pipeline/SKILL.md`(全文見 VOICES-Message `docs/TTS-PLAN.md` 附錄)
4. 首次轉錄自動從 HuggingFace 下載模型(tiny≈75MB / small≈480MB,本機快取)
5. 煙霧測試(選):PowerShell System.Speech 合成語音 → 轉錄驗證(實錄見 §5 P1)

### SKILL.md(video-pipeline)全文

````markdown
---
name: video-pipeline
description: 影片產出管線——長片轉錄→AI 選段→FFmpeg 粗剪與字幕燒錄→人審的個人本機管線。要從影片選段剪短、生成/燒錄字幕、或批次處理影片音軌時使用。規劃依據:MEDIA-Message docs/VIDEO-PIPELINE-PLAN.md。
---

# video-pipeline(長片 → 選段 → 粗剪 → 字幕)

個人本機工具(非 MEDIA-Message 產品功能);決策記錄見 `D:\MEDIA-Message\docs\VIDEO-PIPELINE-PLAN.md`。定位:**只做粗剪**;精剪/追臉構圖/動態字幕交剪輯軟體(剪映),發佈交 MEDIA-Message(M1 既有,手動選檔)。

## 環境(2026-11-13 全數實測)

| 組件 | 位置/版本 | 備註 |
| --- | --- | --- |
| 轉錄腳本 | `C:\Users\a25002\.claude\skills\video-pipeline\scripts\transcribe.py` | faster-whisper 1.2.1,Python 3.14;**解碼不經 PyAV**(相容性細節見腳本檔頭) |
| FFmpeg | `D:\tools\ffmpeg\root\bin\ffmpeg.exe`(未上 PATH,用絕對路徑) | BtbN GPL 建置 2026-11-12;libx264/libass/amix 皆在 |
| 測試素材 | `D:\tools\pipeline-test\`(Windows 內建 TTS 產生的 en/zh 語音+測試影片) | 煙霧測試與日後回歸用 |

## 工作流(五步)

### ① 轉錄(含時間戳)

```bash
python "C:/Users/a25002/.claude/skills/video-pipeline/scripts/transcribe.py" <影片或音檔> --model small --lang zh --zh-tw
```

- 輸出 `<檔名>.srt`(字幕)+ `<檔名>.json`(**word-level 時間戳**,下刀對齊用)
- 繁中一律 `--zh-tw`(實測:輸出維持繁體;不加偏簡體);模型 small=繁中起點,tiny 只作煙霧測試(實測:技術名詞錯字、zh 分段偏粗)
- 任何長度皆可;>10min 長片正是主場,轉錄時間線性增長

### ② 選段(這一步是 Claude 自己做,不是指令)

讀 `.json` 的 segments/words,依使用者給的目標(主題/長度/數量)產出**片段建議清單**:每段=起訖時間戳+入選理由+建議說明(可寫成 caption 草稿)。**隱私紀律:僅送必要文字段落給 API,不整包轉錄稿**(同文管庫「素材只在生成當下進 prompt、用完即棄」)。

### ③ 剪切

```bash
FF=D:/tools/ffmpeg/root/bin/ffmpeg.exe
# 精確剪切(重編碼,時間戳準;短片段建議用這個)
$FF -ss <起> -to <迄> -i input.mp4 -c:v libx264 -pix_fmt yuv420p -c:a aac -y clip.mp4
# 快速無損(-c copy,秒級;但起點會吸附到最近關鍵幀,長素材粗篩用)
$FF -ss <起> -to <迄> -i input.mp4 -c copy -y clip.mp4
```

### ④ 字幕燒錄

```bash
# 先依剪切偏移平移 SRT 時間(片段起點=新 0 點),再燒:
$FF -i clip.mp4 -vf "subtitles=clip.srt" -c:a copy -y burned.mp4
```

### ⑤ 混音(可選;範本未實測,首次使用先驗)

```bash
# 背景音樂壓低混合(ducking 以 amix 起步;不滿意再上 sidechaincompress)
$FF -i clip.mp4 -i music.mp3 -filter_complex "[1:a]volume=0.25[bg];[0:a][bg]amix=inputs=2:duration=first[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -y mixed.mp4
```

真人旁白音檔混入同路(audio-pipeline 的配音產出即此用途)。

### ⑥ 交付

產出資料夾裡的成品 → 維護者核看(必要時剪映精修)→ MEDIA-Message 編發器手動選檔發佈/排程(**檔案層鬆耦合,零產品改動**)。

## 邊界(刻意不做)

- 追臉橫轉直、轉場調色特效、動態逐字字幕 → 剪映
- AI 配音/TTS → audio-pipeline(VOICES-Message TTS-PLAN)
- 瀏覽器內剪輯、文生影片、Atlas Cloud 類付費閘道 → 見 VIDEO-PIPELINE-PLAN D2

## 測試紀錄

- 2026-11-13 煙霧測試全鏈路通:en/zh 語音合成(System.Speech)→ testsrc 影片 → mp4 轉錄(wav 標準庫與 ffmpeg 解碼兩路徑皆驗)→ 5.5s 精確剪切 → 字幕燒錄。zh 實測:`--zh-tw` 下輸出維持繁體。
- 教訓:管線尾端接 `| tail` 會吃掉 exit code(假綠燈),測試指令不加會吞狀態的管線。
````

### scripts/transcribe.py 全文

```python
#!/usr/bin/env python3
"""轉錄+時間戳 → SRT/JSON(faster-whisper;video-pipeline 與 audio-pipeline 共用)。

用法:
  python transcribe.py <input 音檔或影片> [--model small] [--lang zh|en] [--zh-tw] [--outdir DIR]

- --model:tiny 最快(煙霧測試)/ base / small(繁中建議起點)/ medium(更準更慢)
- --zh-tw:繁中引導(降低 Whisper 簡體輸出傾向;繁中內容建議一律加)
- 輸出:<檔名>.srt 與 <檔名>.json(json 含 word-level 時間戳,供精確下刀)

解碼策略(2026-11-13 實測教訓):本機 PyAV 19 與 faster-whisper 1.2.1 不相容
(`metadata_errors` 參數已移除)——故**不經 PyAV**:.wav 走標準庫,其餘格式
用 FFmpeg CLI 轉 16kHz 單聲道 float32 餵 ndarray(faster-whisper 原生支援)。
"""
import argparse
import json
import pathlib
import shutil
import subprocess
import sys
import wave

import numpy as np
from faster_whisper import WhisperModel

FFMPEG_CANDIDATES = ["ffmpeg", "D:/tools/ffmpeg/root/bin/ffmpeg.exe"]


def find_ffmpeg() -> str:
    for c in FFMPEG_CANDIDATES:
        p = shutil.which(c) or (c if pathlib.Path(c).exists() else None)
        if p:
            return p
    return ""


def resample_linear(x: "np.ndarray", src: int, dst: int) -> "np.ndarray":
    if src == dst:
        return x
    n_dst = int(round(len(x) * dst / src))
    return np.interp(
        np.linspace(0.0, len(x) - 1.0, n_dst), np.arange(len(x)), x
    ).astype(np.float32)


def decode_audio(path: pathlib.Path) -> "np.ndarray":
    # 1) 標準庫解 .wav(PCM16)
    try:
        with wave.open(str(path), "rb") as w:
            rate, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
            if sw == 2:
                arr = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
                arr = arr.astype(np.float32) / 32768.0
                if ch > 1:
                    arr = arr.reshape(-1, ch).mean(axis=1)
                return resample_linear(arr, rate, 16000)
    except (wave.Error, EOFError):
        pass
    # 2) FFmpeg 解其餘格式(mp4/webm/m4a/mp3/…)
    ffmpeg = find_ffmpeg()
    if not ffmpeg:
        raise SystemExit("[transcribe] 非 .wav 輸入需要 FFmpeg(PATH 或 D:/tools/ffmpeg/root/bin)")
    out = subprocess.run(
        [ffmpeg, "-v", "error", "-i", str(path), "-ac", "1", "-ar", "16000",
         "-f", "f32le", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(out, dtype=np.float32)


def fmt_ts(seconds: float) -> str:
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("--model", default="small")
    ap.add_argument("--lang", default=None, help="強制語言代碼(zh/en/…);省略=自動偵測")
    ap.add_argument("--zh-tw", action="store_true", help="繁中引導 prompt")
    ap.add_argument("--outdir", default=None)
    a = ap.parse_args()

    src = pathlib.Path(a.input)
    if not src.exists():
        print(f"[transcribe] 找不到輸入檔:{src}", file=sys.stderr)
        return 2
    outdir = pathlib.Path(a.outdir) if a.outdir else src.parent
    outdir.mkdir(parents=True, exist_ok=True)

    audio = decode_audio(src)
    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    prompt = "以下是繁體中文的口語內容,請以繁體中文(台灣用語)逐字轉錄。" if a.zh_tw else None
    segments, info = model.transcribe(
        audio, language=a.lang, initial_prompt=prompt,
        vad_filter=True, word_timestamps=True,
    )

    srt_lines: list[str] = []
    json_segs: list[dict] = []
    for i, seg in enumerate(segments, 1):
        text = seg.text.strip()
        srt_lines += [str(i), f"{fmt_ts(seg.start)} --> {fmt_ts(seg.end)}", text, ""]
        json_segs.append({
            "start": round(seg.start, 3),
            "end": round(seg.end, 3),
            "text": text,
            "words": [
                {"start": round(w.start, 3), "end": round(w.end, 3), "word": w.word}
                for w in (seg.words or [])
            ],
        })

    base = src.stem
    srt_path = outdir / f"{base}.srt"
    json_path = outdir / f"{base}.json"
    srt_path.write_text("\n".join(srt_lines), encoding="utf-8")
    json_path.write_text(
        json.dumps(
            {"language": info.language, "duration": round(info.duration, 3),
             "segments": json_segs},
            ensure_ascii=False, indent=1,
        ),
        encoding="utf-8",
    )
    print(f"[transcribe] {info.language} {round(info.duration, 1)}s "
          f"-> {srt_path.name} / {json_path.name} @ {outdir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```
