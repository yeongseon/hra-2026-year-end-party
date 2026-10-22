const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('required site, documentation and deployment files exist', () => {
  for (const file of ['index.html', 'styles.css', 'script.js', 'assets/castle.svg',
    'assets/favicon.svg', '.nojekyll', 'README.md', 'Makefile',
    '.github/workflows/ci.yml', '.github/workflows/pages.yml']) {
    assert.ok(fs.existsSync(path.join(root, file)), `${file} must exist`);
  }
});

test('page uses the agreed event name and local, project-relative assets', () => {
  const html = read('index.html');
  assert.match(html, /<title>HRA 2026 Year-End Party<\/title>/);
  assert.doesNotMatch(html, /School of Magic/i);
  assert.match(html, /추후 안내/);
  assert.match(html, /(?:추후 공개|More Magic Coming Soon)/);
  for (const [, asset] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (/^(?:https?:|#|mailto:|data:)/.test(asset)) continue;
    assert.ok(!asset.startsWith('/'), `${asset} must support the GitHub Pages project path`);
    assert.ok(fs.existsSync(path.join(root, asset.split(/[?#]/)[0])), `${asset} exists`);
  }
});

test('unconfirmed programs and data collection are absent', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /<form\b|School of Magic/i);
  assert.doesNotMatch(html, /기숙사 배정|마법 퀴즈|팀 대항전|미니게임|점수 집계|실시간 투표|경품 추첨|시상식|행사 타임테이블|참가 신청/);
  assert.doesNotMatch(read('script.js'), /localStorage|sessionStorage|indexedDB|fetch\s*\(/);
});

test('original vector assets and motion preferences are included', () => {
  for (const file of ['assets/castle.svg', 'assets/favicon.svg']) {
    assert.match(read(file), /<svg\b/);
    assert.doesNotMatch(read(file), /<image\b|https?:\/\/(?!www.w3.org)/);
  }
  assert.match(read('styles.css'), /prefers-reduced-motion/);
});
