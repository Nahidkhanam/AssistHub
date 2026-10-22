import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { checkA11y, mockApi, renderApp } from './helpers';

describe('axe finds no violations', () => {
  it.each([
    ['/', 'AssistHub'],
    ['/tools', 'Free and built-in assistive tools'],
    ['/tools/nvda', 'NVDA'],
    ['/checker', 'Page accessibility checker'],
    ['/learn', 'Learn to browse with a screen reader'],
    ['/contact', 'Contact us'],
    ['/login', 'Sign in'],
    ['/register', 'Create an account'],
  ])('%s', async (path, heading) => {
    mockApi();
    const { container } = renderApp(path);
    await screen.findByRole('heading', { level: 1, name: heading });
    await waitFor(() => expect(screen.queryByText(/^Loading/)).toBeNull());
    expect(await checkA11y(container)).toHaveNoViolations();
  });
});

describe('page structure', () => {
  it('has a skip link, landmarks and a sticky header', async () => {
    mockApi();
    const { container } = renderApp('/');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main');
    expect(screen.getByRole('banner')).toHaveClass('sticky');
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'On this page' })).toBeInTheDocument();
    expect(container.querySelectorAll('h1')).toHaveLength(1);
  });
});
