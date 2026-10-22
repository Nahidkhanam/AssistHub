import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import App from '../App';
import { AuthProvider } from '../context/AuthContext';

export const tool = {
  id: '11111111-1111-1111-1111-111111111111', slug: 'nvda', name: 'NVDA', maker: 'NV Access', kind: 'Screen reader', platforms: ['Windows'],
  needs: ['Read the screen aloud'], cost: 'Free and open source', summary: 'Reads what is on a Windows computer with speech and braille output.',
  url: 'https://www.nvaccess.org/', status: 'published', ratingAvg: 4.5, ratingCount: 2, favorited: false,
};

type Handler = (url: URL, init?: RequestInit) => { status?: number; body: unknown } | undefined;

export function mockApi(extra: Handler = () => undefined) {
  const fn = vi.fn(async (input: string, init?: RequestInit) => {
    const url = new URL(input);
    const hit = extra(url, init);
    let status = 200, body: unknown = {};
    if (hit) { status = hit.status ?? 200; body = hit.body; }
    else if (url.pathname === '/api/tools') body = { items: [tool], total: 1, page: 1, pages: 1 };
    else if (url.pathname === '/api/tools/nvda') body = { tool, reviews: [{ id: 'r1', rating: 5, body: 'Easy to start with.', author: 'Ada', createdAt: '2026-01-01' }], myReview: null };
    return { ok: status < 400, status, json: async () => body } as Response;
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}

export function renderApp(path = '/') {
  return render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AuthProvider><App /></AuthProvider></MemoryRouter>);
}

export const checkA11y = (container: HTMLElement) => axe(container, { rules: { 'color-contrast': { enabled: false } } });
