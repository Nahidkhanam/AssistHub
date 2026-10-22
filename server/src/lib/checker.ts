import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

export type Issue = {
  id: string; severity: 'error' | 'warning'; wcag: string; title: string; count: number; fix: string; examples: string[];
};
export type CheckResult = { score: number; rulesChecked: number; rulesPassed: number; issues: Issue[] };

const RULES = 11;

export function analyzeHtml(html: string): CheckResult {
  const $ = cheerio.load(html);
  const issues: Issue[] = [];
  const snippet = (el: AnyNode) => ($.html(el) ?? '').replace(/\s+/g, ' ').slice(0, 120);
  const add = (id: string, severity: Issue['severity'], wcag: string, title: string, fix: string, els: AnyNode[]) => {
    if (els.length) issues.push({ id, severity, wcag, title, count: els.length, fix, examples: els.slice(0, 3).map(snippet) });
  };
  const has = (v: string | undefined) => !!v && v.trim().length > 0;
  const textOf = (el?: AnyNode) => (el ? $(el).text().replace(/\s+/g, ' ').trim() : '');
  const idText = (ids: string | undefined) =>
    (ids ?? '').split(/\s+/).filter(Boolean).map((id) => textOf($(`[id="${id.replace(/"/g, '')}"]`).get(0))).join(' ').trim();
  const nameOf = (el: AnyNode): string => {
    const e = $(el);
    return (e.attr('aria-label') ?? '').trim() || idText(e.attr('aria-labelledby')) || textOf(el) ||
      (e.find('img[alt]').toArray().map((i) => ($(i).attr('alt') ?? '').trim()).join(' ').trim()) || (e.attr('title') ?? '').trim();
  };

  // 1. Page language
  if (!has($('html').attr('lang'))) add('lang', 'error', '3.1.1', 'The page language is not set', 'Add a lang attribute to the html element, for example <html lang="en">.', $('html').toArray().slice(0, 1));
  // 2. Title
  if (!textOf($('head title').get(0))) add('title', 'error', '2.4.2', 'The page has no title', 'Add a short, unique <title> that describes the page.', $('head').toArray().slice(0, 1));
  // 3. Images without alt
  add('img-alt', 'error', '1.1.1', 'Images without an alt attribute', 'Give each informative image a short alt text. Use alt="" for decorative images.',
    $('img').toArray().filter((e) => $(e).attr('alt') === undefined && $(e).attr('role') !== 'presentation' && $(e).attr('aria-hidden') !== 'true'));
  // 4. Form controls without a label
  add('label', 'error', '1.3.1, 3.3.2', 'Form fields without a label', 'Connect each field to a visible <label for="id">, or add aria-label when no visible label is possible.',
    $('input, select, textarea').toArray().filter((e) => {
      const type = ($(e).attr('type') ?? 'text').toLowerCase();
      if (['hidden', 'submit', 'button', 'reset', 'image'].includes(type)) return false;
      const el = $(e); const id = el.attr('id');
      const byFor = id ? textOf($(`label[for="${id.replace(/"/g, '')}"]`).get(0)) : '';
      return !(has(el.attr('aria-label')) || idText(el.attr('aria-labelledby')) || byFor || el.closest('label').length || has(el.attr('title')));
    }));
  // 5. Buttons without a name
  add('button-name', 'error', '4.1.2', 'Buttons without an accessible name', 'Put visible text inside the button, or add aria-label.',
    $('button, [role="button"], input[type="submit"], input[type="button"], input[type="reset"], input[type="image"]').toArray().filter((e) => {
      const el = $(e);
      if (e.type === 'tag' && e.name === 'input') return !(has(el.attr('value')) || has(el.attr('alt')) || has(el.attr('aria-label')) || has(el.attr('title')));
      return !nameOf(e);
    }));
  // 6. Links without a name
  add('link-name', 'error', '2.4.4, 4.1.2', 'Links without an accessible name', 'Give every link descriptive text, or an aria-label for icon-only links.',
    $('a[href]').toArray().filter((e) => !nameOf(e)));
  // 7. Headings
  const heads = $('h1, h2, h3, h4, h5, h6').toArray();
  const h1s = heads.filter((e) => e.type === 'tag' && e.name === 'h1');
  const h1Problem = h1s.length === 0 ? [] : h1s.length > 1 ? h1s.slice(1) : [];
  if (h1s.length === 0) add('h1-missing', 'warning', '1.3.1, 2.4.6', 'The page has no main heading (h1)', 'Add one h1 that names the page.', $('body').toArray().slice(0, 1));
  add('h1-multiple', 'warning', '1.3.1, 2.4.6', 'The page has more than one h1', 'Use a single h1 and make the other headings h2 or lower.', h1Problem);
  let prev = 0; const skips: AnyNode[] = [];
  for (const h of heads) { const lvl = Number((h as { name: string }).name[1]); if (prev && lvl > prev + 1) skips.push(h); prev = lvl; }
  add('heading-order', 'warning', '1.3.1', 'Heading levels are skipped', 'Do not jump from h2 to h4. Keep the levels in order so screen-reader users can navigate by headings.', skips);
  // 8. Main landmark
  if (!$('main, [role="main"]').length) add('main', 'warning', '1.3.1, 2.4.1', 'No main landmark', 'Wrap the main content in a <main> element so users can skip straight to it.', $('body').toArray().slice(0, 1));
  // 9. Zoom blocked
  add('zoom', 'error', '1.4.4', 'Zooming is blocked', 'Remove user-scalable=no and any low maximum-scale from the viewport meta tag.',
    $('meta[name="viewport"]').toArray().filter((e) => {
      const c = ($(e).attr('content') ?? '').toLowerCase().replace(/\s/g, '');
      const max = /maximum-scale=([\d.]+)/.exec(c);
      return /user-scalable=(no|0)/.test(c) || (max !== null && Number(max[1]) < 2);
    }));
  // 10. Duplicate ids
  const seen = new Map<string, AnyNode[]>();
  $('[id]').each((_, e) => { const id = $(e).attr('id')!; seen.set(id, [...(seen.get(id) ?? []), e]); });
  add('dup-id', 'warning', '4.1.2', 'Duplicate id values', 'Each id must be unique on the page, or labels and ARIA references can point to the wrong element.',
    [...seen.values()].filter((v) => v.length > 1).map((v) => v[1]));

  const penalty = issues.reduce((sum, i) => sum + Math.min(i.count, 5) * (i.severity === 'error' ? 6 : 3), 0);
  const failedRules = new Set(issues.map((i) => (i.id === 'h1-missing' || i.id === 'h1-multiple' ? 'h1' : i.id)));
  return { score: Math.max(0, 100 - penalty), rulesChecked: RULES, rulesPassed: RULES - failedRules.size, issues };
}
