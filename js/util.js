export const rand = (n) => Math.floor(Math.random() * n);
export const pick = (a) => a[rand(a.length)];
export function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const sample = (a, n) => shuffle(a).slice(0, n);
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

export const esc = (s) => String(s).replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function poisson(lambda) {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

export function weighted(items, weightFn) {
  const ws = items.map(weightFn);
  let r = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}

// ---- tiny WebAudio sfx -------------------------------------------------
let ctx;
let muted = false;
try { muted = localStorage.getItem('bk-muted') === '1'; } catch {}
export const isMuted = () => muted;
export function toggleMute() {
  muted = !muted;
  try { localStorage.setItem('bk-muted', muted ? '1' : '0'); } catch {}
  return muted;
}
function tone(freq, dur, type = 'sine', vol = 0.15, delay = 0) {
  if (muted) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur);
  } catch {}
}
export const sfx = {
  click: () => tone(660, 0.06, 'square', 0.05),
  good: () => { tone(660, 0.12, 'triangle'); tone(990, 0.2, 'triangle', 0.15, 0.1); },
  bad: () => { tone(220, 0.25, 'sawtooth', 0.08); },
  tick: () => tone(1200, 0.03, 'square', 0.03),
  whistle: () => { tone(2100, 0.18, 'sine', 0.08); tone(2300, 0.35, 'sine', 0.08, 0.2); },
  goal: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.25, 'triangle', 0.12, i * 0.09)); },
  pack: () => { [300, 450, 600, 900, 1200].forEach((f, i) => tone(f, 0.18, 'sine', 0.08, i * 0.06)); },
};
