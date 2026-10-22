import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';
import { afterEach, expect, vi } from 'vitest';

expect.extend(toHaveNoViolations);
afterEach(() => { cleanup(); localStorage.clear(); vi.restoreAllMocks(); });

window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
class RO { observe() {} unobserve() {} disconnect() {} }
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = RO;
