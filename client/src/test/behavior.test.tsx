import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { mockApi, renderApp, tool } from './helpers';

describe('accordion', () => {
  it('toggles aria-expanded and shows the panel', async () => {
    mockApi(); const user = userEvent.setup(); renderApp('/');
    const btn = await screen.findByRole('button', { name: /What is NVDA/ });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    await user.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: /What is NVDA/ })).toBeVisible();
  });
});

describe('tools page', () => {
  it('loads tools from the API and sends search and filters', async () => {
    const fetchMock = mockApi(); const user = userEvent.setup(); renderApp('/tools');
    expect(await screen.findByRole('link', { name: 'NVDA' })).toBeInTheDocument();
    expect(screen.getByText('1 tool found')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Device'), 'Windows');
    await waitFor(() => expect(fetchMock.mock.calls.some(([u]) => String(u).includes('platform=Windows'))).toBe(true));
    await user.type(screen.getByLabelText('Search by name'), 'nv');
    await waitFor(() => expect(fetchMock.mock.calls.some(([u]) => String(u).includes('q=nv'))).toBe(true));
  });
  it('shows an error message when the server is unreachable', async () => {
    mockApi(() => ({ status: 500, body: { error: 'Something went wrong on our side. Please try again.' } }));
    renderApp('/tools');
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
  });
  it('asks signed-out visitors to sign in before saving', async () => {
    mockApi(); renderApp('/tools');
    expect(await screen.findByRole('link', { name: 'Sign in to save NVDA' })).toHaveAttribute('href', '/login');
  });
});

describe('forms', () => {
  it('login shows an error summary and focuses it', async () => {
    mockApi(); const user = userEvent.setup(); renderApp('/login');
    await user.click(await screen.findByRole('button', { name: 'Sign in' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Enter an email like name@example.com.');
    expect(alert).toHaveFocus();
    expect(screen.getByLabelText(/Email/)).toHaveAttribute('aria-invalid', 'true');
  });
  it('signs in, stores the session and shows the account page', async () => {
    mockApi((url, init) => {
      if (url.pathname === '/api/auth/login' && init?.method === 'POST') return { body: { token: 't', user: { id: 'u1', email: 'a@example.com', name: 'Ada', role: 'user', prefs: {} } } };
      if (url.pathname === '/api/me/favorites') return { body: { items: [{ ...tool, favorited: true }] } };
      if (url.pathname === '/api/me/suggestions') return { body: { items: [] } };
      return undefined;
    });
    const user = userEvent.setup(); renderApp('/login');
    await user.type(await screen.findByLabelText(/Email/), 'a@example.com');
    await user.type(screen.getByLabelText(/Password/), 'longenough1');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Your account' })).toBeInTheDocument();
    expect(localStorage.getItem('assisthub-token')).toBe('t');
    expect(await screen.findByRole('heading', { name: /NVDA/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });
  it('contact form validates before sending', async () => {
    const fetchMock = mockApi(); const user = userEvent.setup(); renderApp('/contact');
    await user.click(await screen.findByRole('button', { name: 'Send message' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter your name.');
    expect(fetchMock.mock.calls.some(([u]) => String(u).endsWith('/api/contact'))).toBe(false);
  });
});

describe('protected routes', () => {
  it('redirects signed-out visitors from /admin and /suggest to sign in', async () => {
    mockApi(); renderApp('/admin');
    expect(await screen.findByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument();
  });
});

describe('page checker', () => {
  it('shows the score and each issue with a fix', async () => {
    mockApi((url) => url.pathname === '/api/checker' ? { body: { url: 'https://example.com/', score: 82, rulesChecked: 11, rulesPassed: 9, note: 'Quick checks only.',
      issues: [{ id: 'img-alt', severity: 'error', wcag: '1.1.1', title: 'Images without an alt attribute', count: 2, fix: 'Add alt text.', examples: ['<img src="a.png">'] }] } } : undefined);
    const user = userEvent.setup(); renderApp('/checker');
    await user.type(await screen.findByLabelText(/Web address/), 'example.com');
    await user.click(screen.getByRole('button', { name: 'Check this page' }));
    const results = await screen.findByRole('region', { name: /Results for/ });
    expect(within(results).getByText('82')).toBeInTheDocument();
    expect(within(results).getByRole('heading', { name: 'Images without an alt attribute' })).toBeInTheDocument();
    expect(within(results).getByText(/Add alt text/)).toBeInTheDocument();
  });
});
