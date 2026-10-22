/** Speak a message to screen readers through the global live region. */
export function announce(message: string) {
  const el = document.getElementById('live-region');
  if (!el) return;
  el.textContent = '';
  window.setTimeout(() => { el.textContent = message; }, 50);
}
