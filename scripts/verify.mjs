#!/usr/bin/env node
// Smoke test for the two explainer pages.
// They are single self-contained files: if the script block still parses, the
// cue table is intact and nothing is fetched from the network, the page works.

import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PAGES = [
  { file: 'dist/index.html',    lang: 'zh-CN', marker: '演算台', pill: 'href="en/"' },
  { file: 'dist/en/index.html', lang: 'en',    marker: 'workbench', pill: 'href="../"' },
];
const CUES = 45, SCENES = 10, STEPS = 12;

let failures = 0;
const ok  = (m) => console.log(`  ok    ${m}`);
const bad = (m) => { console.error(`  FAIL  ${m}`); failures++; };
const eq  = (label, got, want) =>
  got === want ? ok(`${label} = ${want}`) : bad(`${label} = ${got}, expected ${want}`);

const tmp = mkdtempSync(join(tmpdir(), 'praxis-verify-'));

for (const page of PAGES) {
  console.log(`\n${page.file}`);
  if (!existsSync(page.file)) {
    console.error('  FAIL  missing — run `npm run build` first');
    failures++;
    continue;
  }
  const html = readFileSync(page.file, 'utf8');

  // 1. size — a truncated file is the most likely breakage
  if (html.length > 500_000) ok(`size ${(html.length / 1e6).toFixed(2)} MB`);
  else bad(`size ${html.length} bytes, expected > 500 kB`);

  // 2. language + marker
  if (html.includes(`<html lang="${page.lang}">`)) ok(`lang="${page.lang}"`);
  else bad(`missing <html lang="${page.lang}">`);
  if (html.includes(page.marker)) ok(`contains "${page.marker}"`);
  else bad(`missing marker "${page.marker}"`);
  if (html.includes(page.pill)) ok('has the language pill');
  else bad('missing the language pill');

  // 3. structure counts
  eq('scenes',  (html.match(/SC\.push\(\{/g) || []).length, SCENES);
  eq('steps',   (html.match(/steps\.push\(\{/g) || []).length, STEPS);
  eq('cues',    (html.match(/data:audio\/mp4/g) || []).length, CUES);

  // 4. nothing is loaded from the network
  const external = [
    [/<script[^>]+\bsrc\s*=/i, 'a <script src>'],
    [/<link[^>]+\bhref\s*=\s*["']?https?:/i, 'a remote stylesheet'],
    [/<img[^>]+\bsrc\s*=\s*["']?https?:/i, 'a remote image'],
    [/url\(\s*["']?https?:/i, 'a remote CSS url()'],
    [/@import\s/i, 'an @import'],
  ];
  for (const [re, what] of external) {
    if (re.test(html)) bad(`loads ${what} — the page must stay self-contained`);
    else ok(`no ${what}`);
  }

  // 5. the inline script still parses
  const first = html.indexOf('<script>');
  const last  = html.lastIndexOf('</script>');
  if (first < 0 || last < first) {
    bad('no inline <script> block found');
  } else {
    const js = html.slice(first + '<script>'.length, last);
    const file = join(tmp, page.file.replace(/[\\/]/g, '_') + '.js');
    writeFileSync(file, js);
    try {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
      ok(`inline script parses (${(js.length / 1e6).toFixed(2)} MB of JS)`);
    } catch (e) {
      bad(`inline script does not parse:\n${e.stderr?.toString() || e.message}`);
    }
  }
}

// 6. the paper text must be valid UTF-8 (it came out of a PDF extractor)
console.log('\npraxis.txt');
try {
  const buf = readFileSync('praxis.txt');
  const text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
  ok(`valid UTF-8, ${text.length.toLocaleString()} chars`);
  if (text.includes('\u0000')) bad('contains NUL bytes');
  else ok('no NUL bytes');
  if (/Praxis/.test(text)) ok('mentions the paper');
  else bad('does not look like the paper');
} catch (e) {
  bad(`not valid UTF-8: ${e.message}`);
}

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
