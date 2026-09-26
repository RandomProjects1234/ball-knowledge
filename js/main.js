import { Hub } from './net.js';
import { Host } from './game.js';
import { MODES, CATEGORIES, DRAFT_SLOTS, canAfford, teamStats, fits, answersFor, gridPoints, setIcons, pool, footleHints } from './modes.js';
import { PLAYERS, P, NATIONS, shortName } from './data.js';
import { cardHTML, photoOf, flagImg, flagUrl } from './card.js';
import { esc, norm, sfx, toggleMute, isMuted, shuffle } from './util.js';

const app = document.getElementById('app');
const S = {
  hub: null, host: null, name: '', players: [], settings: {}, hostId: null, code: null,
  screen: 'home', answered: new Set(), timers: [],
};
window.__BK = S; // debug hook

try { S.name = localStorage.getItem('bk-name') || ''; } catch {}

const isHost = () => S.hub && S.hub.isHost;
const me = () => S.hub?.myId;
const solo = () => S.hub && S.hub.isHost && !S.hub.code;
const clearTimers = () => { S.timers.forEach((t) => clearInterval(t)); S.timers = []; };
const every = (ms, fn) => { const t = setInterval(fn, ms); S.timers.push(t); return t; };

function toast(msg, ms = 2200) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('out'), ms);
  setTimeout(() => t.remove(), ms + 400);
}

function topbar(extra = '') {
  return `<header class="topbar">
    <div class="brand" data-act="leave-confirm"><span class="ball">⚽</span> BALL<b>KNOWLEDGE</b></div>
    <div class="tb-mid">${extra}</div>
    <div class="tb-right">
      ${S.code ? `<span class="room-pill" title="Room code">ROOM <b>${S.code}</b></span>` : ''}
      <button class="icon-btn" data-act="mute" title="Sound">${isMuted() ? '🔇' : '🔊'}</button>
    </div>
  </header>`;
}

// ================================================================= HOME
function renderHome(err = '') {
  clearTimers();
  S.screen = 'home';
  const room = new URLSearchParams(location.search).get('room') || '';
  app.innerHTML = `
  ${topbar()}
  <main class="home">
    <section class="hero">
      <div class="hero-cards">
        ${['kylian-mbappe', 'lamine-yamal', 'erling-haaland', 'zinedine-zidane', 'mohamed-salah'].map((id, i) =>
          cardHTML(id, { size: 'md', extraClass: `fan fan-${i}` })).join('')}
      </div>
      <h1>Do you have <span>ball knowledge?</span></h1>
      <p class="sub">8 football quiz modes with real player photos &amp; FC-style cards. Play solo or with friends online.</p>
    </section>
    <section class="panel join-panel">
      <label class="lbl">Your name</label>
      <input id="name" maxlength="16" placeholder="e.g. Mbappé's Agent" value="${esc(S.name)}">
      <div class="home-btns">
        <button class="btn big primary" data-act="solo">🎮 Play Solo</button>
        <button class="btn big" data-act="host">🌐 Host Online Game</button>
      </div>
      <div class="join-row">
        <input id="code" maxlength="5" placeholder="ROOM CODE" value="${esc(room)}">
        <button class="btn" data-act="join">Join</button>
      </div>
      ${err ? `<p class="err">${esc(err)}</p>` : ''}
    </section>
    <section class="mode-strip">
      ${Object.values(MODES).map((m) => `<div class="mini-mode"><span>${m.icon}</span>${esc(m.name)}</div>`).join('')}
    </section>
  </main>`;
  if (room) app.querySelector('#name').focus();
}

function readName() {
  const n = app.querySelector('#name')?.value.trim() || '';
  if (!n) { toast('Enter a name first'); app.querySelector('#name')?.focus(); return null; }
  S.name = n.slice(0, 16);
  try { localStorage.setItem('bk-name', S.name); } catch {}
  return S.name;
}

function bindHub(hub) {
  S.hub = hub;
  hub.onMsg = onMsg;
  hub.onDisconnect = () => { toast('Disconnected from host'); leave(); };
}

async function startSolo() {
  if (!readName()) return;
  bindHub(Hub.solo());
  S.host = new Host(S.hub, S.name);
  S.host.pushLobby();
}

async function startHost() {
  if (!readName()) return;
  if (!window.Peer) return renderHome('Online play needs the PeerJS script (check your internet connection).');
  app.querySelector('[data-act=host]').textContent = 'Opening room…';
  try {
    const hub = await Hub.host();
    bindHub(hub);
    S.host = new Host(hub, S.name);
    S.host.pushLobby();
  } catch (e) {
    renderHome('Could not open a room: ' + (e.message || e.type));
  }
}

async function startJoin() {
  if (!readName()) return;
  const code = app.querySelector('#code').value.trim().toUpperCase();
  if (code.length !== 5) return toast('Room codes are 5 characters');
  if (!window.Peer) return renderHome('Online play needs the PeerJS script (check your internet connection).');
  app.querySelector('[data-act=join]').textContent = '…';
  try {
    const hub = await Hub.join(code, { name: S.name });
    bindHub(hub);
    S.code = hub.code;
    app.innerHTML = `${topbar()}<main class="center-msg"><div class="spinner"></div><p>Joining room ${esc(code)}…</p></main>`;
  } catch (e) {
    renderHome(e.message || 'Could not join');
  }
}

function leave() {
  clearTimers();
  if (S.host) S.host.stopTimers();
  S.hub?.close();
  Object.assign(S, { hub: null, host: null, code: null, players: [], answered: new Set() });
  history.replaceState(null, '', location.pathname);
  renderHome();
}

// ================================================================= LOBBY
function renderLobby() {
  clearTimers();
  S.screen = 'lobby';
  const st = S.settings;
  const host = isHost();
  const mode = MODES[st.mode];
  const opt = (key, vals, fmt = (v) => v) => `<div class="seg" data-key="${key}">
      ${vals.map((v) => `<button class="${st[key] === v ? 'on' : ''}" data-val="${v}" ${host ? '' : 'disabled'}>${fmt(v)}</button>`).join('')}</div>`;
  let settingsHtml = '';
  const iconsRow = `<div class="set"><span>Icons</span>${opt('icons', [true, false], (v) => (v ? 'On' : 'Off'))}</div>`;
  if (st.mode === 'draft') {
    settingsHtml = `<div class="set"><span>Budget</span>${opt('budget', [15, 20, 25, 30], (v) => '$' + v)}</div>
`;
  } else if (st.mode === 'grid') {
    settingsHtml = `<div class="set"><span>Time</span>${opt('gridTime', [120, 180, 300], (v) => v / 60 + ' min')}</div>`;
  } else if (st.mode === 'footle') {
    settingsHtml = `<div class="set"><span>Rounds</span>${opt('footleRounds', [1, 3, 5])}</div>`;
  } else if (st.mode === 'nameall') {
    settingsHtml = `<div class="set"><span>Time</span>${opt('nameTime', [45, 75, 120], (v) => v + 's')}</div>`;
  } else {
    settingsHtml = `<div class="set"><span>Questions</span>${opt('rounds', [5, 10, 15, 20])}</div>
      <div class="set"><span>Seconds</span>${opt('time', [10, 15, 20])}</div>`;
  }
  const invite = S.code ? `${location.origin}${location.pathname}?room=${S.code}` : '';
  app.innerHTML = `
  ${topbar()}
  <main class="lobby">
    <section class="modes">
      <h2>${host ? 'Pick a game' : 'Host is picking a game…'} <span class="muted count">${Object.keys(MODES).length} modes</span></h2>
      ${CATEGORIES.map(([cat, label]) => `
      <h3 class="cat-h">${label}</h3>
      <div class="mode-grid">
        ${Object.entries(MODES).filter(([, m]) => m.cat === cat).map(([k, m]) => `
          <button class="mode-card ${st.mode === k ? 'sel' : ''} ${cat === 'featured' ? 'feat' : ''}" data-mode="${k}" ${host ? '' : 'disabled'}>
            <div class="mc-icon">${m.icon}</div>
            <div class="mc-name">${esc(m.name)}</div>
            <div class="mc-blurb">${esc(m.blurb)}</div>
          </button>`).join('')}
      </div>`).join('')}
    </section>
    <aside class="side">
      ${S.code ? `<div class="panel code-panel">
        <div class="lbl">Room code</div>
        <div class="big-code">${S.code}</div>
        <button class="btn small" data-act="copy" data-text="${esc(invite)}">📋 Copy invite link</button>
      </div>` : ''}
      <div class="panel">
        <div class="lbl">${esc(mode.icon + ' ' + mode.name)}</div>
        <div class="settings">${settingsHtml}${['trivia', 'flags'].includes(st.mode) ? '' : iconsRow}</div>
        ${host ? `<button class="btn big primary wide" data-act="start">▶ Start${S.players.length > 1 ? ` (${S.players.length} players)` : ''}</button>`
          : '<p class="muted">Waiting for the host to start…</p>'}
      </div>
      <div class="panel">
        <div class="lbl">Players (${S.players.length})</div>
        <ul class="plist">${S.players.map((p) => `<li class="${p.id === me() ? 'me' : ''}">
          <span>${p.id === S.hostId ? '👑 ' : ''}${esc(p.name)}</span><b>${p.total}</b></li>`).join('')}</ul>
        ${S.code && S.players.length < 2 ? '<p class="muted small">Share the code — friends open this page and hit Join.</p>' : ''}
      </div>
      <button class="btn ghost wide" data-act="leave">← Leave</button>
    </aside>
  </main>`;
}

// ================================================================= QUIZ
function scoreboard(showDelta) {
  const rows = [...S.players].sort((a, b) => b.score - a.score);
  if (rows.length < 2 && !showDelta) return '';
  return `<aside class="scoreboard">
    ${rows.map((p, i) => {
      const r = showDelta && S.lastResults?.[p.id];
      return `<div class="sb-row ${p.id === me() ? 'me' : ''}">
        <span class="sb-rank">${i + 1}</span>
        <span class="sb-name">${esc(p.name)}</span>
        ${S.answered.has(p.id) && !showDelta ? '<span class="tick">✓</span>' : ''}
        ${r ? `<span class="delta ${r.ok ? 'ok' : 'no'}">${r.pts ? '+' + r.pts : '✗'}</span>` : ''}
        <b>${p.score}</b></div>`;
    }).join('')}
  </aside>`;
}

function mediaHTML(q, revealed) {
  const m = q.media;
  if (revealed && q.reveal?.pid && !['hl', 'card', 'cards'].includes(m.type)) {
    return `<div class="media reveal-card">${cardHTML(q.reveal.pid, { size: 'lg', extraClass: 'flip-in' })}</div>`;
  }
  switch (m.type) {
    case 'photo':
      return `<div class="media"><div class="photo-frame"><img id="blurimg" src="${esc(m.src)}" referrerpolicy="no-referrer" alt=""></div></div>`;
    case 'career':
      return `<div class="media career">${m.clubs.map((c, i) => `<div class="club-chip ${c === '???' ? 'mystery' : ''}" style="--d:${i * 0.12}s">${esc(c)}</div>${i < m.clubs.length - 1 ? '<span class="arrow">➜</span>' : ''}`).join('')}</div>`;
    case 'clues':
      return `<div class="media clues">${m.clues.map((c, i) => `<div class="clue ${i === 0 ? 'show' : ''}" data-i="${i}"><span>${i + 1}</span><em>${i === 0 ? esc(c) : '🔒 Locked clue'}</em></div>`).join('')}</div>`;
    case 'hl':
      return `<div class="media duo">${cardHTML(m.a, { size: 'lg' })}<div class="vs">VS</div>${cardHTML(m.b, { size: 'lg', hideRating: !revealed, extraClass: revealed ? 'pop' : '' })}</div>`;
    case 'vs':
      return `<div class="media duo">${cardHTML(m.a, { size: 'lg', hideRating: true })}<div class="vs">VS</div>${cardHTML(m.b, { size: 'lg', hideRating: true })}</div>`;
    case 'card':
      return `<div class="media">${cardHTML(m.pid, { size: 'lg', hideRating: !revealed && !m.showRating, extraClass: revealed ? 'pop' : '' })}</div>`;
    case 'cards':
      return `<div class="media cards-row n${m.pids.length}">${m.pids.map((id) => cardHTML(id, { size: m.pids.length > 3 ? 'md' : 'lg',
        hideRating: m.hideRating && !revealed, hideClub: m.hideClub && !revealed, hideFlag: m.hideFlag && !revealed })).join('')}</div>`;
    case 'zoom':
      return `<div class="media"><div class="photo-frame"><img id="zoomimg" src="${esc(m.src)}" referrerpolicy="no-referrer" alt="" style="transform-origin:${m.fx}% ${m.fy}%;transform:scale(6)"></div></div>`;
    case 'pixel':
      return `<div class="media"><div class="photo-frame"><canvas id="pixcanvas" width="250" height="300"></canvas></div></div>`;
    case 'initials':
      return `<div class="media initials"><div class="big-initials">${esc(m.initials)}</div>
        <div class="init-clues">${flagImg(m.nation, 'init-flag')}<span>${esc(m.nation)}</span><span>${esc(m.pos)}</span><span>${esc(m.club)}</span></div></div>`;
    case 'scramble':
      return `<div class="media scramble">${[...m.letters].map((ch, i) => `<span class="tile" style="--d:${i * 0.05}s">${esc(ch)}</span>`).join('')}</div>`;
    case 'flag':
      return `<div class="media"><img class="big-flag" src="https://flagcdn.com/w320/${esc(m.iso)}.png" alt=""></div>`;
    default:
      return `<div class="media text-media"><span class="tag">${esc(m.tag || 'Trivia')}</span></div>`;
  }
}

function answerHTML(q) {
  if (q.kind === 'number') {
    return `<div class="num-answer">
      <div class="num-label muted small">${esc(q.label || 'Your guess')}</div>
      <div class="num-display" id="numval">${q.start ?? 82}</div>
      <input type="range" id="numslider" min="${q.min}" max="${q.max}" value="${q.start ?? 82}">
      <div class="num-btns"><button class="btn" data-act="num-" >−</button><button class="btn primary big" data-act="lock">Lock in</button><button class="btn" data-act="num+">+</button></div>
    </div>`;
  }
  const letters = 'ABCD';
  return `<div class="options ${q.options.length === 2 ? 'two' : ''}">
    ${q.options.map((o, i) => `<button class="opt" data-opt="${i}"><span class="letter">${letters[i]}</span>${esc(o)}</button>`).join('')}
  </div>`;
}

function renderQuestion(m) {
  clearTimers();
  S.screen = 'quiz';
  S.q = m.q; S.qi = m.i; S.n = m.n; S.dur = m.dur; S.myAnswer = null;
  S.players = m.players; S.answered = new Set(); S.lastResults = null;
  const q = m.q;
  const mode = MODES[q.mode];
  app.innerHTML = `
  ${topbar(`<span class="qcount">${mode.icon} ${esc(mode.name)} · ${m.i + 1}/${m.n}</span>`)}
  <main class="quiz">
    <div class="timer"><div class="bar" id="tbar"></div></div>
    <section class="stage">
      ${mediaHTML(q, false)}
      <h2 class="prompt">${esc(q.prompt)}</h2>
      <div id="answers">${answerHTML(q)}</div>
      <div class="feedback" id="feedback"></div>
    </section>
    <div id="sb">${scoreboard(false)}</div>
  </main>`;
  const t0 = performance.now();
  const bar = app.querySelector('#tbar');
  let lastSec = 99;
  every(100, () => {
    const left = Math.max(0, 1 - (performance.now() - t0) / m.dur);
    bar.style.transform = `scaleX(${left})`;
    bar.classList.toggle('low', left < 0.25);
    const sec = Math.ceil(left * m.dur / 1000);
    if (sec <= 3 && sec !== lastSec && sec > 0 && S.myAnswer == null) sfx.tick();
    lastSec = sec;
    if (q.media.type === 'clues') {
      const shown = Math.min(q.media.clues.length, 1 + Math.floor((1 - left) * q.media.clues.length * 1.15));
      app.querySelectorAll('.clue').forEach((c, i) => {
        if (i < shown && !c.classList.contains('show')) {
          c.classList.add('show');
          c.querySelector('em').textContent = q.media.clues[i];
        }
      });
    }
  });
  if (q.media.type === 'photo') {
    const img = app.querySelector('#blurimg');
    img.style.filter = 'blur(26px) grayscale(0.6)';
    requestAnimationFrame(() => setTimeout(() => {
      img.style.transition = `filter ${m.dur}ms cubic-bezier(.25,.7,.45,1)`;
      img.style.filter = 'blur(3px) grayscale(0)';
    }, 30));
  }
  if (q.media.type === 'zoom') {
    const img = app.querySelector('#zoomimg');
    setTimeout(() => { img.style.transition = `transform ${m.dur}ms cubic-bezier(.5,0,.75,.4)`; img.style.transform = 'scale(1)'; }, 50);
  }
  if (q.media.type === 'pixel') startPixel(q.media.src, m.dur);
  if (q.kind === 'number') {
    const sl = app.querySelector('#numslider');
    sl.oninput = () => { app.querySelector('#numval').textContent = sl.value; };
  }
}

function startPixel(src, dur) {
  const cv = app.querySelector('#pixcanvas');
  const ctx = cv.getContext('2d');
  const img = new Image();
  img.referrerPolicy = 'no-referrer';
  img.src = src;
  const t0 = performance.now();
  const small = document.createElement('canvas');
  const sctx = small.getContext('2d');
  const draw = () => {
    if (!img.complete || !img.naturalWidth || !cv.isConnected) return;
    const k = Math.min(1, (performance.now() - t0) / dur);
    const block = Math.max(3, Math.round(34 * Math.pow(1 - k, 1.6)));
    const w = Math.max(1, Math.ceil(cv.width / block)), h = Math.max(1, Math.ceil(cv.height / block));
    small.width = w; small.height = h;
    // cover-crop the photo, top-weighted like the cards
    const r = Math.max(cv.width / img.naturalWidth, cv.height / img.naturalHeight);
    const sw = cv.width / r, sh = cv.height / r;
    const sx = (img.naturalWidth - sw) / 2, sy = (img.naturalHeight - sh) * 0.15;
    sctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, w, h, 0, 0, cv.width, cv.height);
  };
  img.onload = draw;
  every(120, draw);
}

function submitAnswer(a) {
  if (S.myAnswer != null || S.screen !== 'quiz') return;
  S.myAnswer = a;
  sfx.click();
  S.hub.toHost({ t: 'ans', i: S.qi, a });
  if (S.q.kind === 'number') {
    app.querySelector('#answers').classList.add('locked');
    app.querySelector('[data-act=lock]').textContent = `Locked: ${a}`;
  } else {
    app.querySelectorAll('.opt').forEach((b, i) => { b.disabled = true; b.classList.toggle('mine', i === a); });
  }
  app.querySelector('#feedback').textContent = S.players.length > 1 ? 'Locked in — waiting for others…' : '';
}

function renderReveal(m) {
  clearTimers();
  S.players = m.players;
  S.lastResults = m.results;
  const q = S.q;
  const mine = m.results[me()];
  const fb = app.querySelector('#feedback');
  app.querySelector('.timer .bar').style.transform = 'scaleX(0)';
  if (q.kind === 'number') {
    const others = Object.entries(m.results).map(([id, r]) => {
      const p = S.players.find((x) => x.id === id);
      return `<span class="guess ${r.ok ? 'ok' : ''}">${esc(p?.name || '?')}: <b>${r.a ?? '—'}</b></span>`;
    }).join('');
    app.querySelector('#answers').innerHTML = `<div class="num-reveal">Actual ${esc((q.label || 'answer').toLowerCase())}: <b>${m.answer}</b><div class="guesses">${others}</div></div>`;
  } else {
    app.querySelectorAll('.opt').forEach((b, i) => {
      b.disabled = true;
      if (i === m.answer) b.classList.add('correct');
      else if (i === S.myAnswer) b.classList.add('wrong');
      const who = Object.entries(m.results).filter(([, r]) => r.a === i).map(([id]) => S.players.find((p) => p.id === id)?.name);
      if (who.length && S.players.length > 1) b.insertAdjacentHTML('beforeend', `<span class="who">${who.map((n) => esc((n || '?').slice(0, 10))).join(', ')}</span>`);
    });
  }
  const media = app.querySelector('.media');
  if (media) media.outerHTML = mediaHTML(q, true);
  if (mine) {
    if (mine.ok) { sfx.good(); fb.innerHTML = `<span class="ok">✓ +${mine.pts}</span>${mine.streak >= 3 ? ` <span class="streak">🔥 ${mine.streak} streak</span>` : ''}`; }
    else { sfx.bad(); fb.innerHTML = mine.a == null ? '<span class="no">⏰ Too slow!</span>' : `<span class="no">✗ ${mine.pts ? '+' + mine.pts : 'Wrong'}</span>`; }
  }
  if (q.reveal?.text && !q.reveal.pid && q.kind === 'mcq' && !['trivia', 'flags', 'squad', 'connection', 'nation3'].includes(q.mode)) fb.insertAdjacentHTML('beforeend', `<div class="reveal-text">${esc(q.reveal.text)}</div>`);
  app.querySelector('#sb').innerHTML = scoreboard(true);
}

// ================================================================= DRAFT
function pitchHTML(team, currentSlot, small = false) {
  return `<div class="pitch ${small ? 'small' : ''}">
    <div class="pitch-lines"><i class="half"></i><i class="circle"></i><i class="box top"></i><i class="box bot"></i></div>
    ${DRAFT_SLOTS.map((s, i) => {
      const pid = team?.pids[i];
      const inner = pid ? cardHTML(pid, { size: 'xs', price: small ? null : team.prices[i] })
        : `<div class="slot-empty ${i === currentSlot ? 'current' : ''}">${s.key}</div>`;
      return `<div class="slot" style="left:${s.x}%;top:${s.y}%">${inner}</div>`;
    }).join('')}
  </div>`;
}

function renderDraft(m) {
  clearTimers();
  S.screen = 'draft';
  S.draft = m;
  S.myPick = null;
  S.answered = new Set();
  const my = m.teams.find((t) => t.id === me());
  const left = DRAFT_SLOTS.length - m.slot - 1;
  const slot = DRAFT_SLOTS[m.slot];
  const avg = my.pids.length ? Math.round(my.pids.reduce((s, id) => s + P(id).rating, 0) / my.pids.length) : '–';
  app.innerHTML = `
  ${topbar(`<span class="qcount">💵 $${S.settings.budget || 20} Draft · pick ${m.slot + 1}/11</span>`)}
  <main class="draft">
    <div class="timer"><div class="bar" id="tbar"></div></div>
    <section class="draft-main">
      <div class="draft-head">
        <h2>Pick your <span class="pos-hl">${slot.key}</span></h2>
        <div class="budget"><div class="money">$${my.budget}</div><div class="muted small">left · keep $${left} for ${left} more</div></div>
      </div>
      <div class="options-cards">
        ${m.options.map((o) => {
          const ok = canAfford(o.price, my.budget, left);
          return `<button class="pick ${ok ? '' : 'cant'}" data-pick="${o.pid}" ${ok ? '' : 'disabled'}>${cardHTML(o.pid, { size: 'md', price: o.price })}</button>`;
        }).join('')}
      </div>
      <div class="feedback" id="feedback"></div>
    </section>
    <aside class="draft-side">
      <div class="team-head"><b>${esc(my.name)}</b><span>AVG ${avg}</span></div>
      ${pitchHTML(my, m.slot)}
      <div class="rivals">${m.teams.filter((t) => t.id !== me()).map((t) => `<div class="rival" data-tid="${t.id}">
        <span>${t.human ? '🧑' : '🤖'} ${esc(t.name)}</span><span>$${t.budget}</span><span class="tick">${S.answered.has(t.id) ? '✓' : ''}</span></div>`).join('')}</div>
    </aside>
  </main>`;
  const t0 = performance.now();
  const bar = app.querySelector('#tbar');
  every(100, () => {
    const l = Math.max(0, 1 - (performance.now() - t0) / m.dur);
    bar.style.transform = `scaleX(${l})`;
    bar.classList.toggle('low', l < 0.25);
  });
}

function submitPick(pid) {
  if (S.myPick || S.screen !== 'draft') return;
  S.myPick = pid;
  sfx.pack();
  S.hub.toHost({ t: 'pick', slot: S.draft.slot, pid });
  app.querySelectorAll('.pick').forEach((b) => { b.disabled = true; b.classList.toggle('chosen', b.dataset.pick === pid); });
  app.querySelector('#feedback').textContent = S.draft.teams.filter((t) => t.human).length > 1 ? 'Signed! Waiting for the other managers…' : '';
}

function onDraftSlotDone(m) {
  clearTimers();
  const my = m.teams.find((t) => t.id === me());
  const pid = my.pids[m.slot];
  if (!S.myPick) toast(`Time's up — auto-signed ${P(pid).name}`);
  const side = app.querySelector('.draft-side');
  if (side) {
    side.querySelector('.pitch').outerHTML = pitchHTML(my, -1);
    const avg = Math.round(my.pids.reduce((s, id) => s + P(id).rating, 0) / my.pids.length);
    side.querySelector('.team-head span').textContent = `AVG ${avg}`;
    side.querySelector('.rivals').innerHTML = m.teams.filter((t) => t.id !== me()).map((t) =>
      `<div class="rival"><span>${t.human ? '🧑' : '🤖'} ${esc(t.name)}</span><span class="small">${esc(shortName(P(t.pids[m.slot])))} ($${t.prices[m.slot]})</span><span>$${t.budget}</span></div>`).join('');
  }
}

// ================================================================= GRID
function critHTML(c) {
  return c.type === 'nation'
    ? `<div class="crit nation">${flagImg(c.v, 'crit-flag')}<span>${esc(c.v)}</span></div>`
    : `<div class="crit club"><span class="club-badge">${esc(c.v.split(' ').map((w) => w[0]).join('').slice(0, 3))}</span><span>${esc(c.v)}</span></div>`;
}

function renderGrid(m) {
  clearTimers();
  S.screen = 'grid';
  S.grid = { ...m.grid, cells: {}, guesses: m.guesses, done: false, used: new Set() };
  const g = S.grid;
  app.innerHTML = `
  ${topbar(`<span class="qcount">#️⃣ Football Grid</span>`)}
  <main class="gridpage">
    <div class="timer"><div class="bar" id="tbar"></div></div>
    <div class="grid-top"><div>Guesses left: <b id="guesses">${g.guesses}</b></div>
      <div class="muted small">Name a player who fits the row <i>and</i> the column. Obscure picks score more.</div>
      <button class="btn small" data-act="grid-done">I'm done</button></div>
    <div class="grid9">
      <div class="corner">⚽</div>
      ${g.cols.map((c) => `<div class="ghead">${critHTML(c)}</div>`).join('')}
      ${g.rows.map((r, ri) => `<div class="ghead row">${critHTML(r)}</div>${g.cols.map((c, ci) => `<button class="gcell" data-cell="${ri},${ci}"></button>`).join('')}`).join('')}
    </div>
    <div id="sb">${scoreboard(false)}</div>
  </main>`;
  const t0 = performance.now();
  const bar = app.querySelector('#tbar');
  every(200, () => {
    const l = Math.max(0, 1 - (performance.now() - t0) / m.dur);
    bar.style.transform = `scaleX(${l})`;
    bar.classList.toggle('low', l < 0.15);
    if (l <= 0) finishGrid();
  });
}

function openGridSearch(key) {
  const g = S.grid;
  if (g.done || g.cells[key]) return;
  const [r, c] = key.split(',').map(Number);
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `<div class="modal-box">
    <div class="modal-crit">${critHTML(g.rows[r])}<span>×</span>${critHTML(g.cols[c])}</div>
    <input id="gsearch" placeholder="Search any player…" autocomplete="off">
    <div class="sresults" id="gresults"></div>
    <button class="btn ghost small" data-close>Cancel</button></div>`;
  document.body.appendChild(modal);
  const input = modal.querySelector('#gsearch');
  const res = modal.querySelector('#gresults');
  const close = () => modal.remove();
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('[data-close]')) close();
    const item = e.target.closest('[data-pid]');
    if (item) { guessGrid(key, item.dataset.pid); close(); }
  });
  input.oninput = () => {
    const qn = norm(input.value);
    if (qn.length < 2) { res.innerHTML = ''; return; }
    const words = qn.split(' ');
    const hits = pool().filter((p) => { const n = norm(p.name); return words.every((w) => n.includes(w)); })
      .sort((a, b) => norm(a.name).indexOf(words[0]) - norm(b.name).indexOf(words[0])).slice(0, 8);
    res.innerHTML = hits.map((p) => `<button class="res ${g.used.has(p.id) ? 'used' : ''}" data-pid="${p.id}" ${g.used.has(p.id) ? 'disabled' : ''}>
      <img src="${photoOf(p)}" referrerpolicy="no-referrer" alt=""><span>${esc(p.name)}</span>${p.icon ? '<em>ICON</em>' : ''}</button>`).join('')
      || '<div class="muted small">No players found in the database.</div>';
  };
  input.onkeydown = (e) => {
    if (e.key === 'Enter') { const first = res.querySelector('[data-pid]:not([disabled])'); if (first) { guessGrid(key, first.dataset.pid); close(); } }
    if (e.key === 'Escape') close();
  };
  setTimeout(() => input.focus(), 30);
}

function guessGrid(key, pid) {
  const g = S.grid;
  if (g.done || g.guesses <= 0) return;
  const [r, c] = key.split(',').map(Number);
  const p = P(pid);
  g.guesses--;
  app.querySelector('#guesses').textContent = g.guesses;
  const cell = app.querySelector(`[data-cell="${key}"]`);
  if (fits(p, g.rows[r]) && fits(p, g.cols[c])) {
    g.cells[key] = pid;
    g.used.add(pid);
    sfx.good();
    cell.innerHTML = `<img src="${photoOf(p)}" referrerpolicy="no-referrer" alt=""><span class="gname">${esc(shortName(p))}</span><span class="gpts">+${gridPoints(pid)}</span>`;
    cell.classList.add('filled');
  } else {
    sfx.bad();
    cell.classList.add('shake');
    setTimeout(() => cell.classList.remove('shake'), 500);
    toast(`✗ ${p.name} doesn't fit`);
  }
  if (g.guesses <= 0 || Object.keys(g.cells).length === 9) finishGrid();
}

function finishGrid() {
  const g = S.grid;
  if (!g || g.done) return;
  g.done = true;
  clearTimers();
  S.hub.toHost({ t: 'grid-done', cells: g.cells });
  app.querySelector('.grid-top').innerHTML = `<div>Submitted! ${S.players.length > 1 ? 'Waiting for others…' : ''}</div>`;
}

// ================================================================= SHARED PLAYER SEARCH
function searchBoxHTML(placeholder) {
  return `<div class="searchbox"><input id="sbq" placeholder="${esc(placeholder)}" autocomplete="off"><div class="drop" id="sbdrop"></div></div>`;
}

function bindSearch(isUsed) {
  const input = app.querySelector('#sbq');
  const drop = app.querySelector('#sbdrop');
  S.searchUsed = isUsed;
  input.oninput = () => {
    const qn = norm(input.value);
    if (qn.length < 2) { drop.innerHTML = ''; return; }
    const words = qn.split(' ');
    const hits = pool().filter((p) => { const n = norm(p.name); return words.every((w) => n.includes(w)); })
      .sort((a, b) => norm(a.name).indexOf(words[0]) - norm(b.name).indexOf(words[0])).slice(0, 7);
    drop.innerHTML = hits.map((p) => `<button class="res ${isUsed(p.id) ? 'used' : ''}" data-hit="${p.id}" ${isUsed(p.id) ? 'disabled' : ''}>
      <img src="${photoOf(p)}" referrerpolicy="no-referrer" alt=""><span>${esc(p.name)}</span>${p.icon ? '<em>ICON</em>' : ''}</button>`).join('')
      || '<div class="muted small pad">No players found in the database.</div>';
  };
  input.onkeydown = (e) => {
    if (e.key === 'Enter') { const first = drop.querySelector('[data-hit]:not([disabled])'); if (first) onSearchPick(first.dataset.hit); }
  };
  setTimeout(() => input.focus(), 30);
}

function onSearchPick(pid) {
  const input = app.querySelector('#sbq');
  if (input) { input.value = ''; app.querySelector('#sbdrop').innerHTML = ''; input.focus(); }
  if (S.screen === 'footle') footleGuess(pid);
  else if (S.screen === 'nameall') nameAllGuess(pid);
}

function runTimer(dur, onEnd, lowAt = 0.2) {
  const t0 = performance.now();
  const bar = app.querySelector('#tbar');
  every(200, () => {
    const l = Math.max(0, 1 - (performance.now() - t0) / dur);
    bar.style.transform = `scaleX(${l})`;
    bar.classList.toggle('low', l < lowAt);
    if (l <= 0) onEnd();
  });
}

// ================================================================= FOOTLE
const FOOT_COLS = [['nation', 'Nation'], ['pos', 'Pos'], ['club', 'Club'], ['born', 'Born'], ['rating', 'OVR']];

function renderFootle(m) {
  clearTimers();
  S.screen = 'footle';
  S.players = m.players;
  S.answered = new Set();
  const target = decodeURIComponent(escape(atob(m.secret.split('').reverse().join(''))));
  S.footle = { target, round: m.round, max: m.guesses, tries: [], done: false, t0: performance.now(), dur: m.dur };
  app.innerHTML = `
  ${topbar(`<span class="qcount">🟩 Footle · round ${m.round + 1}/${m.rounds}</span>`)}
  <main class="footle">
    <div class="timer"><div class="bar" id="tbar"></div></div>
    <section class="footle-main">
      <div class="footle-top">
        <h2>Guess the mystery player</h2>
        <div class="muted small">🟩 match · 🟨 close (same position group, a former club, or within 2) · ↑↓ higher/lower</div>
      </div>
      <div class="footle-bar">${searchBoxHTML('Type a player name…')}
        <span class="guess-count">Guess <b id="fcount">1</b>/${m.guesses}</span>
        <button class="btn small ghost" data-act="footle-giveup">Give up</button></div>
      <div class="footle-table">
        <div class="ft-row ft-head"><div>Player</div>${FOOT_COLS.map(([, l]) => `<div>${l}</div>`).join('')}</div>
        <div id="ftrows"></div>
      </div>
      <div class="feedback" id="feedback"></div>
    </section>
    <div id="sb">${scoreboard(false)}</div>
  </main>`;
  bindSearch((pid) => S.footle.tries.includes(pid));
  runTimer(m.dur, () => footleSubmit(false));
}

function footleGuess(pid) {
  const f = S.footle;
  if (!f || f.done || f.tries.includes(pid)) return;
  f.tries.push(pid);
  const h = footleHints(pid, f.target);
  const p = P(pid);
  const cell = (k) => {
    const x = h[k];
    const v = k === 'nation' ? `${flagImg(x.v, 'ft-flag')}<span>${esc(x.v)}</span>` : `<span>${esc(x.v)}${x.dir ? ` <b>${x.dir}</b>` : ''}</span>`;
    return `<div class="ft-cell ${x.st}">${v}</div>`;
  };
  app.querySelector('#ftrows').insertAdjacentHTML('afterbegin', `<div class="ft-row flip-row">
    <div class="ft-player"><img src="${photoOf(p)}" referrerpolicy="no-referrer" alt=""><span>${esc(p.name)}</span></div>
    ${FOOT_COLS.map(([k]) => cell(k)).join('')}</div>`);
  const solved = pid === f.target;
  if (solved) { sfx.goal(); footleSubmit(true); return; }
  sfx.click();
  if (f.tries.length >= f.max) return footleSubmit(false);
  app.querySelector('#fcount').textContent = f.tries.length + 1;
}

function footleSubmit(solved) {
  const f = S.footle;
  if (!f || f.done) return;
  f.done = true;
  clearTimers();
  S.hub.toHost({ t: 'footle-done', round: f.round, solved, tries: solved ? f.tries.length : f.max, ms: Math.round(performance.now() - f.t0) });
  const bar = app.querySelector('.footle-bar');
  if (bar) bar.innerHTML = solved
    ? `<div class="solved">🎉 Got him in ${f.tries.length}! ${S.players.length > 1 ? 'Waiting for the others…' : ''}</div>`
    : `<div class="muted">${S.players.length > 1 ? 'Out of guesses — waiting for the others…' : 'Out of guesses!'}</div>`;
}

function renderFootleReveal(m) {
  clearTimers();
  S.players = m.players;
  const f = S.footle;
  if (f && !f.done) { f.done = true; }
  const mine = m.results[me()];
  if (mine && !mine.solved) sfx.bad();
  const rows = Object.entries(m.results).map(([id, r]) => {
    const pl = S.players.find((x) => x.id === id);
    return `<div class="fr-row ${id === me() ? 'me' : ''}"><span>${esc(pl?.name || '?')}</span><span>${r.solved ? `✅ ${r.tries} ${r.tries === 1 ? 'guess' : 'guesses'}` : '❌'}</span><b>+${r.pts}</b></div>`;
  }).join('');
  const main = app.querySelector('.footle-main');
  if (!main) return;
  main.innerHTML = `<div class="footle-reveal">
    <div>${cardHTML(m.target, { size: 'lg', extraClass: 'flip-in' })}</div>
    <div class="fr-side">
      <h2>It was ${esc(P(m.target).name)}</h2>
      <div class="fr-list">${rows}</div>
      <p class="muted">${m.last ? 'Final results coming up…' : 'Next round in a few seconds…'}</p>
    </div></div>`;
  app.querySelector('#sb').innerHTML = scoreboard(false);
}

// ================================================================= NAME THEM ALL
function critLabel(c) {
  return c.type === 'nation' ? `players from ${c.v}` : `players who have played for ${c.v}`;
}

function renderNameAll(m) {
  clearTimers();
  S.screen = 'nameall';
  S.players = m.players;
  S.answered = new Set();
  S.nameall = { crit: m.crit, found: [], done: false };
  app.innerHTML = `
  ${topbar(`<span class="qcount">📝 Name Them All</span>`)}
  <main class="nameall">
    <div class="timer"><div class="bar" id="tbar"></div></div>
    <section class="na-main">
      <div class="na-head">${critHTML(m.crit)}<div><h2>Name ${esc(critLabel(m.crit))}</h2>
        <div class="muted small">There are <b>${m.crit.total}</b> in the database. No penalty for wrong guesses.</div></div>
        <div class="na-count"><b id="nacount">0</b><span>found</span></div></div>
      <div class="na-bar">${searchBoxHTML('Type a player…')}<button class="btn small" data-act="nameall-done">I'm done</button></div>
      <div class="na-found" id="nafound"></div>
    </section>
    <div id="sb">${scoreboard(false)}</div>
  </main>`;
  bindSearch((pid) => S.nameall.found.includes(pid));
  runTimer(m.dur, finishNameAll, 0.15);
}

function nameAllGuess(pid) {
  const n = S.nameall;
  if (!n || n.done || n.found.includes(pid)) return;
  const p = P(pid);
  if (!fits(p, n.crit)) {
    sfx.bad();
    toast(`✗ ${p.name} doesn't fit`, 1400);
    const box = app.querySelector('.searchbox');
    box.classList.add('shake');
    setTimeout(() => box.classList.remove('shake'), 450);
    return;
  }
  sfx.good();
  n.found.push(pid);
  app.querySelector('#nacount').textContent = n.found.length;
  app.querySelector('#nafound').insertAdjacentHTML('afterbegin',
    `<div class="na-chip pop"><img src="${photoOf(p)}" referrerpolicy="no-referrer" alt=""><span>${esc(p.name)}</span></div>`);
}

function finishNameAll() {
  const n = S.nameall;
  if (!n || n.done) return;
  n.done = true;
  clearTimers();
  S.hub.toHost({ t: 'nameall-done', pids: n.found });
  const bar = app.querySelector('.na-bar');
  if (bar) bar.innerHTML = `<div class="muted">Submitted ${n.found.length}! ${S.players.length > 1 ? 'Waiting for the others…' : ''}</div>`;
}

function nameAllResultsHTML(m) {
  const { crit, subs } = m.nameall;
  const all = pool().filter((p) => fits(p, crit));
  const named = new Set(Object.values(subs).flatMap((x) => x.valid));
  const missed = all.filter((p) => !named.has(p.id)).sort((a, b) => b.rating - a.rating);
  const mine = subs[me()] || { valid: [], unique: [] };
  return `<section class="panel na-res">
    <div class="lbl">${esc(critLabel(crit))} · you named ${mine.valid.length}/${all.length}</div>
    <div class="na-found">${mine.valid.map((pid) => `<div class="na-chip"><img src="${photoOf(P(pid))}" referrerpolicy="no-referrer" alt=""><span>${esc(P(pid).name)}${mine.unique.includes(pid) ? ' ★' : ''}</span></div>`).join('') || '<span class="muted">Nobody. Oof.</span>'}</div>
    ${S.players.length > 1 ? `<div class="lbl" style="margin-top:14px">Everyone</div><div class="scorers-list">${Object.entries(subs).map(([id, x]) =>
      `<span>${esc(S.players.find((p) => p.id === id)?.name || '?')} <b>${x.valid.length}</b></span>`).join('')}</div>` : ''}
    <div class="lbl" style="margin-top:14px">Nobody said (${missed.length})</div>
    <div class="missed">${missed.map((p) => esc(p.name)).join(' · ') || 'You got them all! 🐐'}</div>
  </section>`;
}

// ================================================================= RESULTS
function renderResults(m) {
  clearTimers();
  S.screen = 'results';
  const st = m.standings;
  S.players = st;
  const medal = ['🥇', '🥈', '🥉'];
  const myPos = st.findIndex((p) => p.id === me());
  let extra = '';
  if (m.league) extra = draftResultsHTML(m);
  if (m.grid) extra = gridResultsHTML(m);
  if (m.nameall) extra = nameAllResultsHTML(m);
  if (myPos === 0) sfx.goal(); else sfx.whistle();
  app.innerHTML = `
  ${topbar(`<span class="qcount">${MODES[m.mode].icon} ${esc(MODES[m.mode].name)} · Full time</span>`)}
  <main class="results">
    <section class="podium">
      ${m.league ? `<p class="verdict">Your XI finished <b>${ordinal(m.league.standings.findIndex((r) => r.id === me()) + 1)}</b> in the league${m.league.standings[0].id === me() ? ' — CHAMPIONS! 🏆' : ''}</p>` : ''}
      <h2>${st.length > 1 ? (myPos === 0 ? '🏆 You win!' : `You finished ${myPos + 1}${['st', 'nd', 'rd'][myPos] || 'th'}`) : `Final score: ${st[0].score}`}</h2>
      ${st.length === 1 && !m.league && !m.grid && !m.nameall && m.mode !== 'footle' ? `<p class="verdict">${verdict(st[0].score, m.mode)}</p>` : ''}
      <ol class="standings">${st.map((p, i) => `<li class="${p.id === me() ? 'me' : ''}"><span>${medal[i] || i + 1}</span><span>${esc(p.name)}</span><b>${p.score}</b><em>total ${p.total}</em></li>`).join('')}</ol>
      <div class="res-btns">
        ${isHost() ? '<button class="btn primary big" data-act="again">↻ Play again</button><button class="btn big" data-act="to-lobby">Choose another game</button>'
          : '<p class="muted">Waiting for the host…</p>'}
      </div>
    </section>
    ${extra}
  </main>`;
}

const ordinal = (n) => n + (['th', 'st', 'nd', 'rd'][n % 10 > 3 || Math.floor(n / 10) === 1 ? 0 : n % 10] || 'th');

function verdict(score, mode) {
  const perQ = score / Math.max(1, S.settings.rounds || 10);
  if (perQ > 850) return 'Certified ball knower. Pundit contract incoming. 🎙️';
  if (perQ > 650) return 'Serious ball knowledge. The group chat fears you.';
  if (perQ > 400) return 'Decent. You watch highlights, not full matches.';
  if (perQ > 150) return 'Casual detected. Do you even know what a false nine is?';
  return 'Zero ball knowledge. Were you watching netball?';
}

function draftResultsHTML(m) {
  const { teams, league } = m;
  const tName = (id) => teams.find((t) => t.id === id)?.name || '?';
  const my = teams.find((t) => t.id === me());
  const stats = teamStats(my.pids);
  return `<section class="draft-res">
    <div class="panel">
      <div class="lbl">League table</div>
      <table class="table"><tr><th></th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>
      ${league.standings.map((r, i) => `<tr class="${r.id === me() ? 'me' : ''}"><td>${i + 1}</td><td>${esc(tName(r.id))}</td><td>${r.P}</td><td>${r.W}</td><td>${r.D}</td><td>${r.L}</td><td>${r.GF - r.GA > 0 ? '+' : ''}${r.GF - r.GA}</td><td><b>${r.Pts}</b></td></tr>`).join('')}
      </table>
      <div class="lbl" style="margin-top:14px">Results</div>
      <div class="matches">${league.matches.map((x) => `<div class="match">
        <div class="score"><span>${esc(tName(x.a))}</span><b>${x.ga} – ${x.gb}</b><span>${esc(tName(x.b))}</span></div>
        <div class="scorers">${x.events.map((e) => `<span class="${e.side ? 'r' : 'l'}">⚽ ${esc(shortName(P(e.pid)))} ${e.min}'</span>`).join('')}</div></div>`).join('')}</div>
      <div class="lbl" style="margin-top:14px">Golden Boot</div>
      <div class="scorers-list">${league.topScorers.map(([pid, n]) => `<span>${esc(P(pid).name)} <b>${n}</b></span>`).join('')}</div>
    </div>
    <div class="panel">
      <div class="lbl">Your XI · OVR ${stats.ovr} · Chem ${stats.chem}/33 · spent $${my.prices.reduce((a, b) => a + b, 0)}</div>
      ${pitchHTML(my, -1)}
    </div>
    <div class="panel other-teams">
      ${teams.filter((t) => t.id !== me()).map((t) => `<div><div class="lbl">${esc(t.name)} · OVR ${teamStats(t.pids).ovr}</div>${pitchHTML(t, -1, true)}</div>`).join('')}
    </div>
  </section>`;
}

function gridResultsHTML(m) {
  const g = m.grid;
  const mine = m.subs[me()] || { cells: {}, cellPts: {} };
  return `<section class="panel grid-res">
    <div class="lbl">Your grid · +${mine.total || 0} pts ${S.players.length > 1 ? '(+100 for unique picks)' : ''}</div>
    <div class="grid9 small">
      <div class="corner">⚽</div>
      ${g.cols.map((c) => `<div class="ghead">${critHTML(c)}</div>`).join('')}
      ${g.rows.map((r, ri) => `<div class="ghead row">${critHTML(r)}</div>${g.cols.map((c, ci) => {
        const k = `${ri},${ci}`;
        const pid = mine.cells[k];
        const all = answersFor(r, c);
        const eg = shuffle(all.filter((p) => p.id !== pid)).slice(0, 3).map((p) => shortName(p)).join(', ');
        return `<div class="gcell ${pid ? 'filled' : 'empty'}">${pid ? `<img src="${photoOf(P(pid))}" referrerpolicy="no-referrer" alt=""><span class="gname">${esc(shortName(P(pid)))}</span><span class="gpts">+${mine.cellPts[k]?.pts || 0}${mine.cellPts[k]?.unique ? ' ★' : ''}</span>` : ''}
          <span class="alts">${all.length} valid${eg ? ': ' + esc(eg) : ''}</span></div>`;
      }).join('')}`).join('')}
    </div>
  </section>`;
}

// ================================================================= MESSAGES
function onMsg(m) {
  switch (m.t) {
    case 'lobby':
      S.players = m.players; S.settings = m.settings; S.hostId = m.hostId; S.code = m.code;
      setIcons(m.settings.icons);
      if (S.screen === 'results' && !isHost()) { S.screen = 'lobby'; }
      renderLobby();
      break;
    case 'roster':
      S.players = m.players.map((p) => ({ ...p, score: S.players.find((x) => x.id === p.id)?.score ?? p.score }));
      if (S.screen === 'lobby') renderLobby();
      break;
    case 'spectate':
      app.innerHTML = `${topbar()}<main class="center-msg"><div class="spinner"></div><p>A game is in progress — you'll join the next one.</p></main>`;
      break;
    case 'start':
      S.settings.mode = m.mode; S.players = m.players;
      sfx.whistle();
      break;
    case 'q': renderQuestion(m); break;
    case 'progress':
      S.answered = new Set(m.answered);
      if (['quiz', 'grid', 'footle', 'nameall'].includes(S.screen)) app.querySelector('#sb').innerHTML = scoreboard(false);
      break;
    case 'reveal': if (S.screen === 'quiz') renderReveal(m); break;
    case 'draft': renderDraft(m); break;
    case 'picked':
      S.answered = new Set(m.ids);
      app.querySelectorAll('.rival').forEach((r) => { r.querySelector('.tick').textContent = S.answered.has(r.dataset.tid) ? '✓' : ''; });
      break;
    case 'draft-slot-done': onDraftSlotDone(m); break;
    case 'grid': renderGrid(m); break;
    case 'footle': renderFootle(m); break;
    case 'footle-reveal': renderFootleReveal(m); break;
    case 'nameall': renderNameAll(m); break;
    case 'end': renderResults(m); break;
  }
}

// ================================================================= EVENTS
app.addEventListener('click', (e) => {
  const act = e.target.closest('[data-act]')?.dataset.act;
  const modeBtn = e.target.closest('[data-mode]');
  const seg = e.target.closest('.seg button');
  const opt = e.target.closest('[data-opt]');
  const pickBtn = e.target.closest('[data-pick]');
  const cell = e.target.closest('[data-cell]');

  if (opt && !opt.disabled) return submitAnswer(+opt.dataset.opt);
  if (pickBtn && !pickBtn.disabled) return submitPick(pickBtn.dataset.pick);
  if (cell && S.screen === 'grid') return openGridSearch(cell.dataset.cell);
  const hit = e.target.closest('[data-hit]');
  if (hit && !hit.disabled) return onSearchPick(hit.dataset.hit);
  if (modeBtn && isHost()) { sfx.click(); return S.hub.toHost({ t: 'settings', settings: { mode: modeBtn.dataset.mode } }); }
  if (seg && isHost()) {
    const key = seg.parentElement.dataset.key;
    let val = seg.dataset.val;
    val = val === 'true' ? true : val === 'false' ? false : +val;
    sfx.click();
    return S.hub.toHost({ t: 'settings', settings: { [key]: val } });
  }
  switch (act) {
    case 'solo': return startSolo();
    case 'host': return startHost();
    case 'join': return startJoin();
    case 'start': case 'again': return S.hub.toHost({ t: 'start' });
    case 'to-lobby': return S.hub.toHost({ t: 'lobby' });
    case 'leave': return leave();
    case 'leave-confirm': if (S.screen === 'home') return; if (confirm('Leave this game?')) leave(); return;
    case 'mute': toggleMute(); e.target.closest('button').textContent = isMuted() ? '🔇' : '🔊'; return;
    case 'copy': {
      const text = e.target.closest('[data-text]').dataset.text;
      navigator.clipboard?.writeText(text).then(() => toast('Invite link copied!'), () => prompt('Copy this link:', text));
      return;
    }
    case 'lock': return submitAnswer(+app.querySelector('#numslider').value);
    case 'num-': case 'num+': {
      const sl = app.querySelector('#numslider');
      sl.value = +sl.value + (act === 'num+' ? 1 : -1);
      app.querySelector('#numval').textContent = sl.value;
      return;
    }
    case 'grid-done': return finishGrid();
    case 'nameall-done': return finishNameAll();
    case 'footle-giveup': return footleSubmit(false);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' && S.screen === 'home' && e.key === 'Enter') {
    if (e.target.id === 'code') startJoin(); else startSolo();
    return;
  }
  if (S.screen === 'quiz' && S.q?.kind === 'mcq' && !e.target.closest('input')) {
    const i = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, b: 1, c: 2, d: 3 }[e.key.toLowerCase()];
    if (i != null && i < S.q.options.length) submitAnswer(i);
  }
  if (S.screen === 'quiz' && S.q?.kind === 'number' && e.key === 'Enter') submitAnswer(+app.querySelector('#numslider').value);
});

renderHome();
