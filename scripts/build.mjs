#!/usr/bin/env node
// Assemble the two self-contained pages from src/.
//
// Everything the page needs at runtime — styles, canvas engine, scenes,
// workbench, narration — is inlined, so dist/index.html and dist/en/index.html
// are single files that work offline. The sources stay separate so the two
// editions can share one engine and differ only in content.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(ROOT, p), 'utf8');

const EDITIONS = [
  { lang: 'zh', out: 'dist/index.html' },
  { lang: 'en', out: 'dist/en/index.html' },
];

// One cue entry per narration line, in order, base64-inlined.
function narrationBlock(lang) {
  const cues = JSON.parse(read(`audio/${lang}/cues.json`));
  const scenes = [];
  for (const cue of cues) {
    const b64 = readFileSync(join(ROOT, 'audio', lang, cue.file)).toString('base64');
    (scenes[cue.scene] ??= []).push(`{d:${cue.d.toFixed(2)},a:'data:audio/mp4;base64,${b64}'}`);
  }
  const arrays = scenes.map((entries) => '[' + entries.join(',') + ']');
  return 'var VO=[' + '\n' + arrays.join(',\n') + '\n];' + '\n\n';
}

for (const edition of EDITIONS) {
  const { lang } = edition;
  const meta = JSON.parse(read(`src/meta.${lang}.json`));

  const styles = read('src/css/styles.css') +
    (existsSync(join(ROOT, `src/css/styles.${lang}.css`)) ? '\n' + read(`src/css/styles.${lang}.css`) : '');

  const script = [
    read('src/js/helpers.js').replace('__FONT__', () => "'" + meta.font + "'"),
    read('src/js/scene-header.js'),
    narrationBlock(lang),
    read(`src/js/scenes.${lang}.js`),
    read(`src/js/lab.${lang}.js`),
    read('src/js/engine.js'),
  ].join('');

  const html = read('src/shell.html')
    .replace('{{LANG}}', () => meta.lang)
    .replace('{{TITLE}}', () => meta.title)
    .replace('{{DESCRIPTION}}', () => meta.description)
    .replace('{{STYLES}}', () => styles)
    .replace('{{BODY}}', () => read(`src/body.${lang}.html`))
    .replace('{{SCRIPT}}', () => script);

  const out = join(ROOT, edition.out);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, html);
  console.log(`${edition.out}  ${(html.length / 1e6).toFixed(2)} MB  (${lang})`);
}
