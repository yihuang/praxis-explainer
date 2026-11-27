#!/usr/bin/env node
// The workbench ships a toy Praxis inside a template string and evaluates it in
// the browser. That code is what the page invites the reader to redo by hand, so
// it has to be right: this runs the same source here and checks the property the
// page claims — only the witnesses of a statement can decrypt it.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const Q = 10007, P = 240169, G = 205555;
const INPUTS = [[0,0,0],[0,0,1],[0,1,0],[0,1,1],[1,0,0],[1,0,1],[1,1,0],[1,1,1]];

let failures = 0;
const ok  = (m) => console.log(`  ok    ${m}`);
const bad = (m) => { console.error(`  FAIL  ${m}`); failures++; };

// Pull the source out of the lab module without executing the module itself.
function toySource(file) {
  const s = readFileSync(join(ROOT, file), 'utf8');
  const m = s.match(/var TOYSRC = `([\s\S]*?)`;/);
  if (!m) throw new Error(`no TOYSRC in ${file}`);
  return m[1].replace(/\\`/g, '`').replace(/\\\$\{/g, '${').replace(/\\\\/g, '\\');
}
const load = (file) => new Function(toySource(file))();

// The five constraints the page offers, in test order, plus the three
// booleanity tests (index 5..7) that are always kept.
const C = [
  { name: 'w₁·w₃ = 1',           sat: (c) => c[0] === 1 && c[2] === 1 },
  { name: 'w₂·(w₁+w₃) = 0',      sat: (c) => !(c[1] === 1 && (c[0] === 1 || c[2] === 1)) },
  { name: 'w₁·w₂ = 0',           sat: (c) => !(c[0] === 1 && c[1] === 1) },
  { name: '(w₁+w₂)·w₃ = 1',      sat: (c) => c[2] === 1 && c[0] + c[1] === 1 },
  { name: 'w₁+w₂+w₃ = 2',        sat: (c) => c[0] + c[1] + c[2] === 2 },
];

function run(label, toy, picked, expect) {
  console.log(`\n${label}`);
  const keep = [...picked, 5, 6, 7];
  const inst = toy.Praxis(Q, P, G, keep.map((k) => toy.tests(Q)[k]));
  const holders = INPUTS.filter((c) => picked.every((k) => C[k].sat(c)));

  const mu = keep.map((_, i) => 3 + i * 2);           // fixed, so the test is deterministic
  const ct = inst.enc([22, 2, 16, 46], [8, 9, 3, 4], 13, 42, 7, mu);

  let opened = [];
  for (const c of INPUTS) {
    const d = inst.dec(ct, [1, ...c]);
    if (d.r !== null) opened.push({ c, d });
  }

  const witnesses = holders.map((c) => c.join(''));
  const decrypted = opened.map((o) => o.c.join(''));

  witnesses.length === expect
    ? ok(`${witnesses.length} of 8 inputs satisfy the statement`)
    : bad(`${witnesses.length} witnesses, expected ${expect}`);

  const openedWitnesses = witnesses.filter((k) => decrypted.includes(k));
  openedWitnesses.length === witnesses.length
    ? ok(`every witness decrypts (${witnesses.length}/${witnesses.length})`)
    : bad(`${openedWitnesses.length} of ${witnesses.length} witnesses decrypt`);

  // A non-witness opens only if its r̂ lands in the search window, odds about
  // (window)/(q) — the toy's whole security budget. Rare, not impossible: the
  // statistical run below pins the rate down.
  const coincidence = opened.length - openedWitnesses.length;
  if (coincidence) console.log(`        (${coincidence} non-witness hit by chance — odds are about 41/${Q})`);

  const d = inst.dec(ct, [1, 1, 0, 1]);               // the statement's witness
  d.r !== null && d.key === inst.seal(13)
    ? ok('the witness recovers [κ] = g^13')
    : bad(`the witness did not recover [κ] (got ${d.key})`);
  return witnesses.length;
}

const zh = load('src/js/lab.zh.js');

const counts = [
  run('all five constraints (the page default)', zh, [0,1,2,3,4], 1),
  run('only w₁·w₃ = 1',                         zh, [0],         2),
  run('only w₂·(w₁+w₃) = 0',                    zh, [1],         5),
  run('no constraints at all',                  zh, [],          8),
];

// The counts the page states in its own copy.
counts.join() === '1,2,5,8'
  ? ok(`\nwitness counts ${counts.join(' / ')} match the page's claim`)
  : bad(`witness counts ${counts.join(' / ')}, expected 1 / 2 / 5 / 8`);

// False accepts: re-encrypt 40 times with fresh coins and count how often a
// non-witness slips through. Theory says each tries 41 values out of q.
console.log('\nfalse-accept rate (40 fresh encryptions, 7 non-witnesses each)');
{
  let seed = 0x5f3759df;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  const keep = [0, 1, 2, 3, 4, 5, 6, 7];
  const inst = zh.Praxis(Q, P, G, keep.map((k) => zh.tests(Q)[k]));
  const holders = new Set(INPUTS.filter((c) => C.every((x) => x.sat(c))).map((c) => c.join('')));
  let trials = 0, hits = 0;
  for (let i = 0; i < 40; i++) {
    const y = [0,0,0,0].map(() => Math.floor(rnd() * Q));
    const r = [0,0,0,0].map(() => Math.floor(rnd() * 9));
    const mu = keep.map(() => 1 + Math.floor(rnd() * (Q - 1)));
    const ct = inst.enc(y, r, 13, 42, 7, mu);
    for (const c of INPUTS) {
      if (holders.has(c.join(''))) continue;
      trials++;
      if (inst.dec(ct, [1, ...c]).r !== null) hits++;
    }
  }
  const rate = hits / trials;
  const ceiling = 3 * 41 / Q;                    // 3x the theoretical 41/q
  rate <= ceiling
    ? ok(`${hits}/${trials} = ${(rate * 100).toFixed(2)}% (ceiling ${(ceiling * 100).toFixed(2)}%)`)
    : bad(`${hits}/${trials} = ${(rate * 100).toFixed(2)}%, above the ${(ceiling * 100).toFixed(2)}% ceiling`);
}

// The English module must ship the same cryptography, comments aside.
console.log('\nenglish module');
const en = load('src/js/lab.en.js');
const e = run('all five constraints', en, [0,1,2,3,4], 1);
e === 1 ? ok('same result as the Chinese module') : bad(`english module gives ${e}, expected 1`);

console.log(failures ? `\n${failures} check(s) failed` : '\nthe toy crypto behaves as the page claims');
process.exit(failures ? 1 : 0);
