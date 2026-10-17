/* Check bilingual data integrity, embedded JS syntax and every geometric figure. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const textFields = new Set(['title', 'statement', 'text', 'note', 'remarks', 'q', 'hint', 'answer', 'aka', 'kid', 'term',
  'euclidTitle', 'euclidNote', 'courseTitle', 'courseSubtitle', 'elementsTitle', 'companionLabel']);
function load(name) {
  const html = fs.readFileSync(path.join(root, name), 'utf8');
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  scripts.forEach((s, i) => new vm.Script(s, { filename: `${name}:script-${i}` }));
  const context = { window: {} };
  vm.createContext(context);
  for (const source of scripts) {
    if (source.includes('geom.js —') || source.startsWith('window.STORE=') || source.includes("root.FIGS") || source.includes('window.FSX_ENABLED =')) {
      vm.runInContext(source, context);
    }
  }
  return { html, ...context.window };
}
function compare(en, zh, location = '') {
  if (typeof en !== 'object' || en === null) {
    const key = location.split('.').at(-1);
    if (textFields.has(key) || key === 'companionHref' || location.startsWith('.course.labels.')) return;
    assert.equal(zh, en, `Changed non-text data: ${location}`);
  } else {
    const keys = o => Object.keys(o).filter(k => !(location === '.course' && k === 'labels'));
    assert.deepEqual(keys(zh), keys(en), `Changed structure: ${location}`);
    for (const key of Object.keys(en)) {
      // Text arrays (remarks) inherit their field name.
      if (textFields.has(key)) continue;
      compare(en[key], zh[key], `${location}.${key}`);
    }
  }
}
let figures = 0;
for (const name of ['index', 'arithmetica']) {
  const en = load(`${name}.html`), zh = load(`${name}-zh.html`);
  compare(JSON.parse(JSON.stringify(en.STORE)), JSON.parse(JSON.stringify(zh.STORE)));
  assert.equal(zh.STORE.brand.companionHref, name === 'index' ? 'arithmetica-zh.html' : 'index-zh.html');
  assert.ok(zh.html.includes('lang="zh-CN"'));
  assert.equal(en.STORE.corpus.books.length, name === 'index' ? 6 : 1);
  for (const chapter of en.STORE.courseChapters) {
    for (const theorem of chapter.theorems || []) {
      assert.ok(en.FSX_ENABLED.has(theorem.id), `${theorem.id}: missing studio entry`);
    }
  }
  for (const [id, definition] of Object.entries(en.FIGS)) {
    const figure = en.Geom.makeFigure(definition, {});
    const svg = String(figure.render({ w: 640, h: 480, upTo: Infinity }));
    assert.ok(svg.includes('<svg'), `${name} / ${id}: missing SVG`);
    assert.ok(!/\b(?:NaN|Infinity)\b/.test(svg), `${name} / ${id}: non-finite SVG coordinate`);
    if (id === 'ch3:def:11' || id === 'b4:def:4') {
      const points = figure.fig.pts, center = points.C, count = id === 'ch3:def:11' ? 5 : 3;
      const radius = en.Geom.dist(center, points.T);
      for (let i = 0; i < count; i++) {
        const a = points['P' + i], b = points['P' + ((i + 1) % count)];
        const distance = en.Geom.dist(center, en.Geom.footOf(center, a, b));
        assert.ok(Math.abs(distance - radius) < 1e-8, `${id}: polygon side does not touch circle`);
      }
    }
    figures++;
  }
  console.log(`${name}: bilingual structure, references and script syntax OK; ${Object.keys(en.FIGS).length} figures rendered`);
}
console.log(`Passed: 4 pages, ${figures} figure renders.`);
