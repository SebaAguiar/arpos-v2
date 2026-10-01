# BGM License Note — Arcom Landing Demo

Proof of commercial safety for the background music track used in the Arcom landing demo video.

---

## Track

| Field | Value |
|---|---|
| **Title** | Ambient Corporate - Ambient Corporate Music |
| **Author / Artist** | JonasBlakewood |
| **Tags (per source page)** | Corporate, Uplifting, Ambient |
| **File** | `assets/bgm/track.mp3` |
| **Duration** | **150.047 s** (2:30.05) |
| **Format** | MP3, MPEG-1 Layer III, 256 kbps, 44.1 kHz, stereo (Joint Stereo) |
| **Size** | 4,801,515 bytes (≈4.6 MiB) |
| **Integrated loudness** | −7.6 LUFS, LRA 6.0 LU |

---

## Source

- **Track page:** https://pixabay.com/music/corporate-ambient-corporate-ambient-corporate-music-593999/
- **Direct file URL (CDN, no login/API key):**
  ```
  https://cdn.pixabay.com/download/audio/2026/08/29/audio_b02b9b8f93.mp3?filename=jonasblakewood-ambient-corporate-ambient-corporate-music-593999.mp3
  ```
- **License summary (verified source page):** https://pixabay.com/service/license-summary/
- **Full binding license text:** https://pixabay.com/service/terms/

---

## License: Pixabay Content License

**Verbatim from the Pixabay Content License Summary** (fetched and read at
`https://pixabay.com/service/license-summary/`):

> **What are you allowed to do with Content?**
> Subject to the Prohibited Uses (see below), the Content License allows users to:
> - ✓ Use Content for free
> - ✓ Use Content **without having to attribute the author** (although giving credit is always appreciated by our community!)
> - ✓ Modify or adapt Content into new works

**Relevant prohibitions and how this project complies:**

- *"You cannot sell or distribute Content (either in digital or physical form) on a
  Standalone basis."* — Compliant. The track is **not** redistributed as a standalone
  music file; it is incorporated as background audio inside an original commercial
  video (the Arcom landing demo), which is explicitly a "new work" under the license.
- *"You cannot use any of the Content as part of a trade-mark, design-mark,
  trade-name, business name or service mark."* — Compliant. The track is used as
  soundtrack only; the Arcom name/brand assets are not derived from it.
- *"You cannot use that Content for commercial purposes in relation to goods and
  services"* — this applies only to Content containing recognisable trademarks,
  logos or brands. This track is an instrumental music bed with no such marks.

**Conclusion: free for commercial use, no attribution required. No CC-BY obligation,
no NC (non-commercial) restriction, no ND (no-derivatives) restriction.**

---

## Exact command used to download

```bash
mkdir -p videos/arcom-landing-demo/assets/bgm
cd videos/arcom-landing-demo/assets/bgm

curl -s -L --max-time 120 \
  -A "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36" \
  -o track.mp3 \
  "https://cdn.pixabay.com/download/audio/2026/08/29/audio_b02b9b8f93.mp3?filename=jonasblakewood-ambient-corporate-ambient-corporate-music-593999.mp3"
```

The `cdn.pixabay.com` host is the origin CDN behind `pixabay.com` and serves the
file directly — **no account, no login, no API key, no captcha.**

> Note for reproducibility: `pixabay.com` HTML pages sit behind Cloudflare and return
> HTTP 403 to plain `curl`. The CDN file URL above does not. If you ever need to
> re-derive the URL, the CDN link was read from the track page's metadata.

---

## Verification performed

```bash
$ ffprobe -v error \
  -show_entries format=format_name,duration,bit_rate,size \
  -show_entries stream=codec_name,sample_rate,channels \
  -of default=noprint_wrappers=1 track.mp3
codec_name=mp3
sample_rate=44100
channels=2
format_name=mp3
duration=150.047344
bit_rate=255999
size=4801515
```

```bash
$ file track.mp3
track.mp3: MPEG ADTS, layer III, v1, 256 kbps, 44.1 kHz, JntStereo
```

Both the track page (title + author + "Royalty-free Music") and the Pixabay Content
License Summary were read and quoted above. No license terms were assumed or invented.

---

## Technical notes for the edit

1. **Length is sufficient** — 150 s vs. the ~45–50 s target video. Use the first
   ~50 s; **no looping or crossfade is required.**
2. **The track fades out at the end** (last 2 s average −28.6 dBFS), so the natural
   tail is a soft decay, which suits a silent-film end card.
3. **True peak is +1.1 dBFS** (heavily limited master). If the final mix clips, duck
   the music and/or re-limit it, e.g.:
   ```bash
   ffmpeg -i track.mp3 -af "volume=-3dB,alimiter=limit=0.891" track_norm.mp3
   ```
4. **Measured tempo ≈ 115–125 BPM** (amplitude-envelope autocorrelation). If a slower
   100 BPM bed is preferred, time-stretch without changing pitch:
   ```bash
   ffmpeg -i track.mp3 -af "atempo=0.833" track_100bpm.mp3   # ≈120 -> 100 BPM
   ```

---

## Documented fallback (evaluated, not used)

- **"Chill Pills - Uplifting Chillout Music"** — Alaeddin Hallak, Internet Archive
  identifier `ChillPills`, license **CC0 1.0**
  (`http://creativecommons.org/publicdomain/zero/1.0/`), 78k+ downloads.
  Rejected only because individual tracks are ~55–60 min / ~140 MB each and the
  style reads as trance/lounge rather than warm tech underscore. It remains a valid
  CC0 fallback with an even cleaner license than Pixabay's.

### Sources evaluated and rejected

| Source | Reason rejected |
|---|---|
| freemusicarchive.org (corporate/ambient results) | Returned `by-nc/4.0`, `by-nc-nd/4.0` and `by/4.0` tracks — NC/ND and attribution obligations both disqualify |
| freepd.com | Site is closed ("FreePD.com - Site Closed") |
| pixabay.com via plain `curl` | Cloudflare HTTP 403 / "Just a moment..." challenge |
| incompetech.com | Predominantly CC-BY 4.0 — attribution required, excluded by the brief |
| archive.org CC0 netlabel search (51,993 publicdomain hits) | Vastly dominated by classical/78rpm transfers and chiptune/demoscene; no clean "warm tech underscore" match surfaced |
