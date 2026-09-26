// Host-side controller. Owns the truth (players, scores, timers) and tells
// every client what to show. In solo mode it simply has one player.
import { MODES, makeQuestions, scoreAnswer, DRAFT_SLOTS, draftOptions, aiPick, canAfford,
  runLeague, AI_TEAMS, makeGrid, fits, gridPoints, setIcons, footlePick, nameAllCriterion } from './modes.js';
import { P } from './data.js';
import { shuffle } from './util.js';

const QUIZ_TIME = { whoami: 1.4, hl: 0.8, tf: 0.7, flags: 0.7, scramble: 1.15, oddone: 1.2, squad: 1.1, gap: 1.1 };

export class Host {
  constructor(hub, myName) {
    this.hub = hub;
    this.players = new Map();
    this.settings = { mode: 'mixed', rounds: 10, time: 15, budget: 20, icons: true, gridTime: 180, footleRounds: 3, nameTime: 75 };
    this.phase = 'lobby';
    this.addPlayer(hub.myId, myName);
    hub.onHostMsg = (id, m) => this.handle(id, m);
    hub.onJoin = (id, m) => {
      this.addPlayer(id, String(m.name || 'Player').slice(0, 16));
      this.pushLobby();
      if (this.phase !== 'lobby') this.hub.sendTo(id, { t: 'spectate', phase: this.phase });
    };
    hub.onLeave = (id) => {
      this.players.delete(id);
      this.pushLobby();
      this.checkAllIn();
    };
  }

  addPlayer(id, name) {
    this.players.set(id, { id, name, score: 0, total: 0, streak: 0, playing: this.phase === 'lobby' });
  }

  get humans() { return [...this.players.values()].filter((p) => p.playing); }
  roster() {
    return [...this.players.values()].map(({ id, name, score, total, streak }) => ({ id, name, score, total, streak }));
  }

  pushLobby() {
    if (this.phase === 'lobby') {
      this.hub.broadcast({ t: 'lobby', players: this.roster(), settings: this.settings, hostId: this.hub.myId, code: this.hub.code });
    } else {
      this.hub.broadcast({ t: 'roster', players: this.roster() });
    }
  }

  handle(id, m) {
    if (!m || !this.players.has(id)) return;
    if (m.t === 'ans') this.onAnswer(id, m);
    else if (m.t === 'pick') this.onPick(id, m);
    else if (m.t === 'grid-done') this.onGridDone(id, m);
    else if (m.t === 'footle-done') this.onFootleDone(id, m);
    else if (m.t === 'nameall-done') this.onNameAllDone(id, m);
    else if (id === this.hub.myId) {
      // host-only commands
      if (m.t === 'settings') { Object.assign(this.settings, m.settings); this.pushLobby(); }
      else if (m.t === 'start') this.start();
      else if (m.t === 'lobby') { this.stopTimers(); this.phase = 'lobby'; this.pushLobby(); }
    }
  }

  stopTimers() {
    clearTimeout(this.timer);
    clearTimeout(this.timer2);
  }

  start() {
    this.stopTimers();
    this.players.forEach((p) => { p.score = 0; p.streak = 0; p.playing = true; });
    const mode = this.settings.mode;
    setIcons(this.settings.icons);
    this.hub.broadcast({ t: 'start', mode, players: this.roster() });
    if (mode === 'draft') this.startDraft();
    else if (mode === 'grid') this.startGrid();
    else if (mode === 'footle') this.startFootle();
    else if (mode === 'nameall') this.startNameAll();
    else this.startQuiz(mode);
  }

  finish(extra = {}) {
    this.stopTimers();
    this.phase = 'results';
    this.players.forEach((p) => { p.total += p.score; });
    const standings = this.roster().sort((a, b) => b.score - a.score);
    this.hub.broadcast({ t: 'end', mode: this.settings.mode, standings, ...extra });
  }

  checkAllIn() {
    if (this.phase === 'quiz' && this.q && this.humans.every((p) => this.answers[p.id])) this.endQuestion();
    if (this.phase === 'draft' && this.humans.every((p) => this.draftPicks[p.id])) this.endSlot();
    if (this.phase === 'grid' && this.humans.every((p) => this.gridSubs[p.id])) this.endGrid();
    if (this.phase === 'footle' && this.humans.every((p) => this.footleSubs[p.id])) this.endFootleRound();
    if (this.phase === 'nameall' && this.humans.every((p) => this.nameSubs[p.id])) this.endNameAll();
  }

  // ------------------------------------------------------------ quiz
  startQuiz(mode) {
    this.phase = 'quiz';
    this.qs = makeQuestions(mode, this.settings.rounds);
    this.qi = -1;
    this.nextQuestion();
  }

  nextQuestion() {
    this.qi++;
    if (this.qi >= this.qs.length) return this.finish();
    this.q = this.qs[this.qi];
    this.answers = {};
    this.dur = Math.round(this.settings.time * 1000 * (QUIZ_TIME[this.q.mode] || 1));
    this.qStart = Date.now();
    this.hub.broadcast({ t: 'q', i: this.qi, n: this.qs.length, q: this.q, dur: this.dur, players: this.roster() });
    this.timer = setTimeout(() => this.endQuestion(), this.dur + 500);
  }

  onAnswer(id, m) {
    if (this.phase !== 'quiz' || m.i !== this.qi || this.answers[id]) return;
    this.answers[id] = { a: m.a, msLeft: Math.max(0, this.dur - (Date.now() - this.qStart)) };
    this.hub.broadcast({ t: 'progress', answered: Object.keys(this.answers) });
    this.checkAllIn();
  }

  endQuestion() {
    if (!this.q) return;
    clearTimeout(this.timer);
    const q = this.q;
    this.q = null;
    const results = {};
    for (const p of this.humans) {
      const ans = this.answers[p.id];
      const r = scoreAnswer(q, ans?.a, ans?.msLeft || 0, this.dur);
      if (r.ok) { p.streak++; if (p.streak >= 3) r.pts += Math.min(250, (p.streak - 2) * 50); } else p.streak = 0;
      p.score += r.pts;
      results[p.id] = { a: ans ? ans.a : null, ...r, streak: p.streak };
    }
    this.hub.broadcast({ t: 'reveal', i: this.qi, answer: q.answer, results, players: this.roster() });
    this.timer = setTimeout(() => this.nextQuestion(), q.kind === 'number' ? 4200 : 3600);
  }

  // ------------------------------------------------------------ $20 draft
  startDraft() {
    this.phase = 'draft';
    const B = this.settings.budget;
    this.teams = this.humans.map((p) => ({ id: p.id, name: p.name, human: true, budget: B, pids: [], prices: [] }));
    const aiNames = shuffle(AI_TEAMS);
    for (let i = 0; this.teams.length < 4; i++) {
      const [name, style] = aiNames[i];
      this.teams.push({ id: 'ai' + i, name, human: false, style, budget: B, pids: [], prices: [] });
    }
    this.used = new Set();
    this.slot = -1;
    this.nextSlot();
  }

  nextSlot() {
    this.slot++;
    if (this.slot >= DRAFT_SLOTS.length) return this.endDraft();
    this.options = draftOptions(this.slot, this.used);
    this.draftPicks = {};
    this.dur = 25000;
    this.hub.broadcast({ t: 'draft', slot: this.slot, options: this.options, dur: this.dur, teams: this.teams });
    this.timer = setTimeout(() => this.endSlot(), this.dur + 500);
  }

  onPick(id, m) {
    if (this.phase !== 'draft' || m.slot !== this.slot || this.draftPicks[id]) return;
    const team = this.teams.find((t) => t.id === id);
    const opt = this.options.find((o) => o.pid === m.pid);
    const left = DRAFT_SLOTS.length - this.slot - 1;
    if (!team || !opt || !canAfford(opt.price, team.budget, left)) return;
    this.draftPicks[id] = opt;
    this.hub.broadcast({ t: 'picked', ids: Object.keys(this.draftPicks) });
    this.checkAllIn();
  }

  endSlot() {
    if (!this.draftPicks || this.draftPicks.done) return;
    clearTimeout(this.timer);
    const left = DRAFT_SLOTS.length - this.slot - 1;
    for (const t of this.teams) {
      let o = this.draftPicks[t.id];
      if (!o) o = aiPick(this.options, t.budget, left, t.human ? 'saver' : t.style);
      t.pids.push(o.pid);
      t.prices.push(o.price);
      t.budget -= o.price;
    }
    this.draftPicks = { done: true };
    this.hub.broadcast({ t: 'draft-slot-done', slot: this.slot, teams: this.teams });
    this.timer = setTimeout(() => this.nextSlot(), 1400);
  }

  endDraft() {
    this.phase = 'draft-sim';
    const league = runLeague(this.teams);
    const reward = [1000, 600, 300, 100];
    league.standings.forEach((row, i) => {
      const p = this.players.get(row.id);
      if (p) p.score += reward[i] || 0;
    });
    this.finish({ teams: this.teams, league });
  }

  // ------------------------------------------------------------ grid
  startGrid() {
    this.phase = 'grid';
    this.grid = makeGrid();
    this.gridSubs = {};
    this.dur = this.settings.gridTime * 1000;
    this.hub.broadcast({ t: 'grid', grid: this.grid, dur: this.dur, guesses: 12 });
    this.timer = setTimeout(() => this.endGrid(), this.dur + 3000);
  }

  onGridDone(id, m) {
    if (this.phase !== 'grid' || this.gridSubs[id]) return;
    this.gridSubs[id] = m.cells || {};
    this.hub.broadcast({ t: 'progress', answered: Object.keys(this.gridSubs) });
    this.checkAllIn();
  }

  endGrid() {
    if (this.phase !== 'grid') return;
    this.phase = 'grid-end';
    const g = this.grid;
    const subs = {};
    const multi = this.humans.length > 1;
    for (const p of this.humans) {
      const cells = this.gridSubs[p.id] || {};
      const cellPts = {};
      let total = 0;
      for (const [k, pid] of Object.entries(cells)) {
        const [r, c] = k.split(',').map(Number);
        const pl = P(pid);
        if (!pl || !fits(pl, g.rows[r]) || !fits(pl, g.cols[c])) continue;
        let pts = gridPoints(pid);
        const unique = multi && !this.humans.some((o) => o.id !== p.id && (this.gridSubs[o.id] || {})[k] === pid);
        if (unique) pts += 100;
        cellPts[k] = { pts, unique };
        total += pts;
      }
      p.score += total;
      subs[p.id] = { cells, cellPts, total };
    }
    this.finish({ grid: g, subs });
  }
  // ------------------------------------------------------------ Footle
  startFootle() {
    this.footleRound = -1;
    this.nextFootle();
  }

  nextFootle() {
    this.footleRound++;
    if (this.footleRound >= this.settings.footleRounds) return this.finish();
    this.phase = 'footle';
    this.target = footlePick();
    this.footleSubs = {};
    this.dur = 150000;
    // Lightly obfuscated so the answer isn't sitting in plain sight in devtools.
    const secret = btoa(unescape(encodeURIComponent(this.target))).split('').reverse().join('');
    this.hub.broadcast({ t: 'footle', round: this.footleRound, rounds: this.settings.footleRounds, secret, guesses: 8, dur: this.dur, players: this.roster() });
    this.timer = setTimeout(() => this.endFootleRound(), this.dur + 2500);
  }

  onFootleDone(id, m) {
    if (this.phase !== 'footle' || m.round !== this.footleRound || this.footleSubs[id]) return;
    this.footleSubs[id] = { solved: !!m.solved, tries: +m.tries || 8, ms: +m.ms || this.dur };
    this.hub.broadcast({ t: 'progress', answered: Object.keys(this.footleSubs) });
    this.checkAllIn();
  }

  endFootleRound() {
    if (this.phase !== 'footle') return;
    clearTimeout(this.timer);
    this.phase = 'footle-reveal';
    const results = {};
    for (const p of this.humans) {
      const sub = this.footleSubs[p.id] || { solved: false, tries: 8, ms: this.dur };
      const pts = sub.solved ? 1000 + (8 - sub.tries) * 100 + Math.round(300 * Math.max(0, 1 - sub.ms / this.dur)) : 0;
      p.score += pts;
      results[p.id] = { ...sub, pts };
    }
    this.hub.broadcast({ t: 'footle-reveal', target: this.target, results, players: this.roster(),
      last: this.footleRound + 1 >= this.settings.footleRounds });
    this.timer = setTimeout(() => this.nextFootle(), 6000);
  }

  // ------------------------------------------------------------ Name Them All
  startNameAll() {
    this.phase = 'nameall';
    this.crit = nameAllCriterion();
    this.nameSubs = {};
    this.dur = this.settings.nameTime * 1000;
    this.hub.broadcast({ t: 'nameall', crit: this.crit, dur: this.dur, players: this.roster() });
    this.timer = setTimeout(() => this.endNameAll(), this.dur + 3000);
  }

  onNameAllDone(id, m) {
    if (this.phase !== 'nameall' || this.nameSubs[id]) return;
    this.nameSubs[id] = Array.isArray(m.pids) ? m.pids.slice(0, 200) : [];
    this.hub.broadcast({ t: 'progress', answered: Object.keys(this.nameSubs) });
    this.checkAllIn();
  }

  endNameAll() {
    if (this.phase !== 'nameall') return;
    this.phase = 'nameall-end';
    const multi = this.humans.length > 1;
    const subs = {};
    for (const p of this.humans) {
      const valid = [...new Set(this.nameSubs[p.id] || [])].filter((pid) => P(pid) && fits(P(pid), this.crit));
      let pts = 0;
      const unique = [];
      for (const pid of valid) {
        pts += 100;
        if (multi && !this.humans.some((o) => o.id !== p.id && (this.nameSubs[o.id] || []).includes(pid))) { pts += 50; unique.push(pid); }
      }
      p.score += pts;
      subs[p.id] = { valid, unique, pts };
    }
    this.finish({ nameall: { crit: this.crit, subs } });
  }
}

export { MODES };
