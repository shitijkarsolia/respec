# Respec demo video — built with HyperFrames

A ~28s silent, captioned product demo of [Respec](https://respec-ai.vercel.app), authored
as **video-as-code** with [HeyGen HyperFrames](https://github.com/heygen-com/hyperframes)
(HTML + GSAP → deterministic 1920×1080 / 30fps MP4). Light theme, every feature in one
clip, under 30 seconds.

## How it's made

```
capture.mjs   Playwright drives the REAL app (light theme) and records per-scene
   │            clips (injected cursor + click ripples, tour hidden)
   ▼
convert.sh    trims the lead-in, speeds each clip up, and re-encodes to a
   │            seekable mp4 so the whole composition lands under 30s
   ▼
index.html    HyperFrames composition: branded intro/outro (GSAP) + the clips
   │            as <video> tracks with Ken-Burns zooms + animated captions
   ▼
render        npx hyperframes render → renders/respec-demo.mp4
```

Storyboard (one clip, under 30s): intro → landing → canvas reveal → hover-to-trace →
agent flags → annotate → compile feedback → approve + handoff → outro.

## Regenerate

```bash
# 1. run the app
cd ../respec && npm run dev          # http://localhost:3000

# 2. capture the real flow in light theme (Playwright comes from ../respec/node_modules)
cd ../demo-video && THEME=light RAWDIR=assets/raw-light node capture.mjs

# 3. trim, speed up, and encode the clips
bash convert.sh

# 4. preview / render
npx hyperframes preview              # studio timeline editor
npx hyperframes render --quality high --output renders/respec-demo.mp4
```

`assets/*.mp4` are the captured scene clips the composition plays; `assets/raw-light/`
(intermediate webm) and `renders/` are gitignored.

> In a network-restricted sandbox, HyperFrames' `onnxruntime-node` postinstall (AI features
> we don't use) may fail — install with `npm i hyperframes --ignore-scripts`, supply ffmpeg via
> `@ffmpeg-installer/ffmpeg` + `ffprobe-static`, and point the CLI at them with
> `HYPERFRAMES_FFMPEG_PATH` / `HYPERFRAMES_FFPROBE_PATH` (and a headless Chrome via
> `PRODUCER_HEADLESS_SHELL_PATH`).
