import { describe, expect, it } from 'vitest';
import { analyzeHtml } from '../src/lib/checker.js';

const good = `<!doctype html><html lang="en"><head><title>Home</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body><main><h1>Welcome</h1><h2>Section</h2><img src="a.png" alt="A cane"><img src="d.png" alt="">
<label for="n">Name</label><input id="n"><button>Send</button><a href="/x">Read more</a></main></body></html>`;

describe('analyzeHtml', () => {
  it('gives a clean page a score of 100', () => {
    const r = analyzeHtml(good);
    expect(r.issues).toEqual([]);
    expect(r.score).toBe(100);
    expect(r.rulesPassed).toBe(r.rulesChecked);
  });

  it('finds common problems', () => {
    const bad = `<html><head><meta name="viewport" content="width=device-width, user-scalable=no"></head>
    <body><h2>Hi</h2><h4>Skipped</h4><img src="a.png"><input type="text"><button></button><a href="/x"><img src="i.png"></a>
    <div id="d"></div><div id="d"></div></body></html>`;
    const ids = analyzeHtml(bad).issues.map((i) => i.id);
    for (const id of ['lang', 'title', 'img-alt', 'label', 'button-name', 'link-name', 'h1-missing', 'heading-order', 'main', 'zoom', 'dup-id']) {
      expect(ids).toContain(id);
    }
    expect(analyzeHtml(bad).score).toBeLessThan(50);
  });

  it('accepts labels from aria-label, aria-labelledby and wrapping labels', () => {
    const html = `<html lang="en"><head><title>t</title></head><body><main><h1>x</h1>
      <input aria-label="Search"><span id="l">City</span><input aria-labelledby="l"><label>Email <input></label>
      <button aria-label="Close"></button><a href="/" aria-label="Home"><svg></svg></a></main></body></html>`;
    expect(analyzeHtml(html).issues).toEqual([]);
  });

  it('flags more than one h1', () => {
    const html = good.replace('<h2>Section</h2>', '<h1>Second</h1>');
    expect(analyzeHtml(html).issues.map((i) => i.id)).toContain('h1-multiple');
  });
});
