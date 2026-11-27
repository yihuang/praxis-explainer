# Praxis, explained

Two self-contained pages that explain **witness encryption** through the Praxis
construction ([*Praxis: Practical Witness Encryption for NP*](https://arxiv.org/abs/2609.18275),
Tse–Vanjani–Vesely, 2026): what the problem is, why it stayed open for thirteen
years, and what the scheme actually does — down to arithmetic you can redo by hand.

They are built from one codebase. The engine, the workbench machinery and the
styles are shared; the two editions differ only in *content* — prose, canvas
labels, workbench text and narration.

## Layout

```
src/
  shell.html            document template
  css/styles.css        shared stylesheet
  css/styles.en.css     English overrides (font stack, swipe hint)
  body.zh.html          the prose: hero, ten acts, workbench shell, footer
  body.en.html
  meta.zh.json          lang / title / description / canvas font
  meta.en.json
  js/helpers.js         canvas helpers, colours, text primitives   (shared)
  js/scene-header.js    section banner                             (shared)
  js/engine.js          timeline, player, scroll, section nav       (shared)
  js/scenes.zh.js       ten animated acts, draw code + captions
  js/scenes.en.js
  js/lab.zh.js          the twelve-step workbench
  js/lab.en.js
audio/
  zh/NN-NN.m4a          one clip per narration cue
  zh/cues.json          scene / index / duration for each clip
  en/…
scripts/build.mjs       assembles dist/, inlining the audio
scripts/verify.mjs      smoke test (build first)
praxis.txt              the paper's text, UTF-8
```

`dist/index.html` and `dist/en/index.html` are generated and not committed: each
is one file with styles, script and base64 narration inlined, so it opens from
disk with no network at all.

## Build

```sh
node scripts/build.mjs     # or: npm run build
node scripts/verify.mjs    # or: npm run verify  (builds nothing; run after build)
open dist/index.html
```

`verify.mjs` asserts, for both pages: the inline script still parses
(`node --check`), the scene / step / cue tables are intact, nothing is loaded
from the network, and `praxis.txt` is valid UTF-8.

## Deployment

Pushes to `main` build and deploy to GitHub Pages:

- `/` → the Chinese edition
- `/en/` → the English edition

Workflows: `pages.yml` (build → verify → deploy `dist/`) and `ci.yml` (the same
build and test on every other branch and PR).

## Narration

The clips are DeepSeek TTS (`POST /v1/tools/tts`, voice `stella`, 24 kHz mono),
converted to AAC. To re-record, synthesise each cue in `cues.json` order, keep
the file names, update the durations, and rebuild — the timeline re-times itself
from the durations, so the visuals follow whatever pacing the voice has.
