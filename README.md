# Praxis, explained

Two self-contained pages that explain **witness encryption** through the Praxis
construction ([*Praxis: Practical Witness Encryption for NP*](https://arxiv.org/abs/2609.18275),
Tse–Vanjani–Vesely, 2026): what the problem is, why it stayed open for thirteen
years, and what the scheme actually does — down to arithmetic you can redo by hand.

| | |
|---|---|
| [`praxis-explainer.html`](praxis-explainer.html) | 中文版 · ten animated acts, a twelve-step workbench, voice track |
| [`praxis-explainer-en.html`](praxis-explainer-en.html) | English edition · same content, re-recorded narration |
| `praxis.txt` | the paper's text (extracted from the PDF, valid UTF-8) |

Each `.html` is one file with everything inline — canvas, audio (45 base64 m4a
cues), CSS. No network at runtime: open it from disk and it works offline.

## Local

```sh
open praxis-explainer.html        # or just double-click it
node scripts/verify.mjs           # the same smoke test CI runs
```

## Deployment

Pushes to `main` deploy to GitHub Pages:

- `/` → the Chinese edition
- `/en/` → the English edition

Enable it once under **Settings → Pages → Build and deployment → Source:
GitHub Actions**. The workflows are `.github/workflows/pages.yml` (build +
deploy) and `ci.yml` (smoke test on every other branch and PR).

## Checks

`scripts/verify.mjs` asserts, for both pages: the inline script still parses
(`node --check`), the scene / step / cue tables are intact, nothing is loaded
from the network, and `praxis.txt` is valid UTF-8.
