import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { announce } from '../lib/announce';
import ReadAloud from './ReadAloud';
import { useAuth } from '../context/AuthContext';

const SIZES = [100, 112.5, 125, 150];

function usePrefs() {
  const { user, savePrefs } = useAuth();
  const [size, setSizeState] = useState(() => Number(localStorage.getItem('assisthub-size') ?? 0));
  const [high, setHighState] = useState(() => localStorage.getItem('assisthub-contrast') === 'high');
  useEffect(() => {
    document.documentElement.style.setProperty('--base-size', `${SIZES[size]}%`);
    localStorage.setItem('assisthub-size', String(size));
  }, [size]);
  useEffect(() => {
    document.documentElement.dataset.contrast = high ? 'high' : 'normal';
    localStorage.setItem('assisthub-contrast', high ? 'high' : 'normal');
  }, [high]);
  // Signing in loads the settings saved on the account.
  useEffect(() => {
    const p = user?.prefs;
    if (typeof p?.textSize === 'number' && p.textSize >= 0 && p.textSize < SIZES.length) setSizeState(p.textSize);
    if (typeof p?.contrast === 'boolean') setHighState(p.contrast);
  }, [user?.id]);
  const setSize = (n: number) => { setSizeState(n); savePrefs({ textSize: n, contrast: high }); };
  const setHigh = (h: boolean) => { setHighState(h); savePrefs({ textSize: size, contrast: h }); };
  return { size, setSize, high, setHigh };
}

const sections = [['about', 'About'], ['featured', 'Featured tool'], ['catalog', 'Free tools'], ['who', 'Who it helps'], ['faq', 'FAQ']];

function jump(e: MouseEvent<HTMLAnchorElement>, id: string) {
  e.preventDefault();
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  el.focus({ preventScroll: true });
  history.replaceState(null, '', `#${id}`);
}

const titles: Record<string, string> = { '/': 'Home', '/tools': 'Tools', '/checker': 'Page checker', '/learn': 'Learn', '/contact': 'Contact us', '/login': 'Sign in', '/register': 'Create an account', '/account': 'Your account', '/suggest': 'Suggest a tool', '/admin': 'Admin', '/privacy': 'Privacy' };

export default function Layout() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { size, setSize, high, setHigh } = usePrefs();
  const { user, logout } = useAuth();
  const [first, setFirst] = useState(true);
  const headerRef = useRef<HTMLElement>(null);

  // Keep anchor targets from hiding under the sticky header.
  useEffect(() => {
    const el = headerRef.current; if (!el) return;
    const set = () => document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Move focus to the page heading on route change so screen readers announce the new page.
  useEffect(() => {
    document.title = `${titles[pathname] ?? 'AssistHub'} | AssistHub`;
    if (first) { setFirst(false); return; }
    const target = (document.querySelector('h1') ?? document.getElementById('main')) as HTMLElement | null;
    target?.setAttribute('tabindex', '-1');
    target?.focus();
    window.scrollTo(0, 0);
  }, [pathname]);

  const link = ({ isActive }: { isActive: boolean }) =>
    `px-2 py-2 font-medium underline-offset-4 hover:underline ${isActive ? 'underline' : ''}`;
  const btn = 'min-h-11 min-w-11 px-3 rounded border-2 border-current font-semibold';

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-3 focus:font-bold focus:text-[#000080]">
        Skip to main content
      </a>
      <div id="live-region" role="status" aria-live="polite" className="sr-only-live" />

      <header ref={headerRef} className="sticky top-0 z-40 shadow-md">
        <div className="bg-brand text-onbrand">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <Link to="/" className="text-xl font-bold">AssistHub</Link>
            <nav aria-label="Main" className="flex flex-wrap items-center gap-2">
              <NavLink to="/" end className={link}>Home</NavLink>
              <NavLink to="/tools" className={link}>Tools</NavLink>
              <NavLink to="/checker" className={link}>Page checker</NavLink>
              <NavLink to="/learn" className={link}>Learn</NavLink>
              <NavLink to="/contact" className={link}>Contact us</NavLink>
              {user ? (
                <>
                  <NavLink to="/account" className={link}>Account</NavLink>
                  {user.role === 'admin' && <NavLink to="/admin" className={link}>Admin</NavLink>}
                  <button type="button" onClick={() => { logout(); nav('/'); announce('Signed out.'); }} className="min-h-11 px-2 font-medium underline-offset-4 hover:underline">Sign out</button>
                  <Link to="/suggest" className="ml-1 inline-flex min-h-11 items-center rounded-full bg-onbrand px-5 font-bold text-brand">Suggest a tool</Link>
                </>
              ) : (
                <>
                  <NavLink to="/login" className={link}>Sign in</NavLink>
                  <Link to="/register" className="ml-1 inline-flex min-h-11 items-center rounded-full bg-onbrand px-5 font-bold text-brand">Create account</Link>
                </>
              )}
            </nav>
          </div>
        </div>
        <div className="border-b-2 border-brand bg-paper text-brand">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-1">
            {pathname === '/' ? (
              <nav aria-label="On this page">
                <ul className="flex flex-wrap gap-x-5">
                  {sections.map(([id, label]) => (
                    <li key={id}><a href={`#${id}`} onClick={(e) => jump(e, id)} className="inline-flex min-h-11 items-center font-medium underline-offset-4 hover:underline">{label}</a></li>
                  ))}
                </ul>
              </nav>
            ) : <span />}
            <div role="group" aria-label="Display and reading settings" className="flex flex-wrap items-center gap-2 text-sm">
              <button className={btn} onClick={() => setSize(Math.max(0, size - 1))} disabled={size === 0} aria-label="Make text smaller">A−</button>
              <button className={btn} onClick={() => setSize(Math.min(SIZES.length - 1, size + 1))} disabled={size === SIZES.length - 1} aria-label="Make text larger">A+</button>
              <button className={btn} aria-pressed={high} onClick={() => setHigh(!high)}>High contrast</button>
              <ReadAloud key={pathname} />
            </div>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
        <Outlet />
      </main>

      <footer className="bg-brand text-onbrand">
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-10">
          <p className="text-2xl font-bold">AssistHub</p>
          <p className="max-w-prose">An independent, non-commercial guide to free assistive technology. Tool names and trademarks belong to their owners. AssistHub is not affiliated with or endorsed by any of them, and all descriptions are written by us.</p>
          <p>Details can change, so always confirm on the official site. <Link className="underline" to="/contact">Contact us</Link> · <Link className="underline" to="/suggest">Suggest a tool</Link> · <Link className="underline" to="/privacy">Privacy</Link></p>
        </div>
      </footer>
    </>
  );
}
