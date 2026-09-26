// Pure game logic: question generators, the $20 draft and the grid. Runs on the
// host only; results are sent to everyone as plain JSON.
import { PLAYERS, ACTIVE_PLAYERS, P, POS_NAME, NATIONS } from './data.js?v=mui1zywn';
import { PHOTOS } from './photos.js?v=mui1zywn';
import { TRIVIA } from './trivia.js?v=mui1zywn';
import { pick, shuffle, sample, rand, poisson, weighted, clamp } from './util.js?v=mui1zywn';

export const CATEGORIES = [
  ['featured', '⭐ Big games'],
  ['photos', '📸 Photo rounds'],
  ['clubs', '🏟️ Careers & clubs'],
  ['players', '🕵️ Guess the player'],
  ['numbers', '📊 Ratings & numbers'],
  ['trivia', '🧠 Trivia'],
];

export const MODES = {
  draft: { cat: 'featured', name: '$20 Draft', icon: '💵', blurb: 'Players go under the hammer. Outbid your rival for a 5-a-side team (GK, CB, CM, ST, ST). Best rated team wins.', special: true },
  footle: { cat: 'featured', name: 'Footle', icon: '🟩', blurb: 'Wordle for footballers. Guess the mystery player from colour-coded hints.', special: true },
  grid: { cat: 'featured', name: 'Football Grid', icon: '#️⃣', blurb: 'Fill a 3×3 grid: a player who fits both the row and the column.', special: true },
  nameall: { cat: 'featured', name: 'Name Them All', icon: '📝', blurb: 'One club or country, 75 seconds. Name as many players as you can.', special: true },
  budgetxi: { cat: 'featured', name: 'Budget XI', icon: '📋', blurb: 'Pick a full XI from priced cards on a budget, then play a mini league.', special: true },
  mixed: { cat: 'featured', name: 'Ball Knowledge Gauntlet', icon: '🔥', blurb: 'A random mix of every quiz. The true test.' },
  photo: { cat: 'photos', name: 'Guess the Player', icon: '📸', blurb: 'A blurry photo slowly sharpens. Name him before everyone else.' },
  zoom: { cat: 'photos', name: 'Zoomed In', icon: '🔍', blurb: 'Starts as an extreme close-up and slowly zooms out.' },
  pixel: { cat: 'photos', name: 'Pixel Player', icon: '👾', blurb: 'A retro 8-bit photo that gets less blocky every second.' },
  career: { cat: 'clubs', name: 'Career Path', icon: '🧭', blurb: 'Club history only. Whose career is this?' },
  gap: { cat: 'clubs', name: 'Fill the Gap', icon: '🧩', blurb: 'One club is missing from the career path. Which one?' },
  connection: { cat: 'clubs', name: 'Club Connection', icon: '🔗', blurb: 'Two players, one shared club. Find the link.' },
  squad: { cat: 'clubs', name: 'Name the Club', icon: '🏟️', blurb: 'Three players who all played for the same club. Which club?' },
  oddone: { cat: 'clubs', name: 'Odd One Out', icon: '🙃', blurb: 'Three of them share a club. Spot the one who does not belong.' },
  whoami: { cat: 'players', name: 'Who Am I?', icon: '🕵️', blurb: 'Clues drop one by one. Faster answer = more points.' },
  initials: { cat: 'players', name: 'Mystery Initials', icon: '🔠', blurb: 'Initials, flag, position and club. Who is it?' },
  scramble: { cat: 'players', name: 'Name Scramble', icon: '🔀', blurb: 'Unscramble the surname before the clock runs out.' },
  nation3: { cat: 'players', name: 'Name the Nation', icon: '🌍', blurb: 'Three players from one national team. Which country?' },
  hl: { cat: 'numbers', name: 'Higher or Lower', icon: '📈', blurb: 'Is his FC rating higher or lower? Who is older?' },
  rate: { cat: 'numbers', name: 'Rate the Card', icon: '🎴', blurb: 'Guess the FC 26 rating. Closest wins.' },
  highest: { cat: 'numbers', name: 'Top Rated', icon: '👑', blurb: 'Four cards, ratings hidden. Who is the highest rated?' },
  youngest: { cat: 'numbers', name: 'Baby Face', icon: '🍼', blurb: 'Four players. Who is the youngest?' },
  born: { cat: 'numbers', name: 'Birth Year', icon: '🎂', blurb: 'Guess the year he was born. Closest wins.' },
  trivia: { cat: 'trivia', name: 'Trivia Blitz', icon: '🧠', blurb: "World Cups, Ballon d'Ors, records, derbies, transfers." },
  tf: { cat: 'trivia', name: 'True or False', icon: '✅', blurb: 'Rapid-fire football facts. Real or cap?' },
  flags: { cat: 'trivia', name: 'Flag Frenzy', icon: '🏳️', blurb: 'Name the football nation from its flag.' },
};

// ---------------------------------------------------------------- helpers
// Icons (retired legends) can be switched off for every mode.
let ICONS_ON = true;
export const setIcons = (v) => { ICONS_ON = v !== false; };
export const pool = () => (ICONS_ON ? PLAYERS : ACTIVE_PLAYERS);
const withPhoto = () => pool().filter((p) => PHOTOS[p.id]);

function lookalikes(p, n, filter = () => true) {
  // Same position group and era, close in rating, so answers aren't gimmes.
  let cands = pool().filter((x) => x.id !== p.id && x.group === p.group && x.icon === p.icon && filter(x));
  if (cands.length < n) cands = pool().filter((x) => x.id !== p.id && filter(x));
  cands = shuffle(cands).sort((a, b) => Math.abs(a.rating - p.rating) - Math.abs(b.rating - p.rating));
  return sample(cands.slice(0, Math.max(n * 3, 10)), n);
}

function mcq(mode, prompt, media, correct, wrongs, reveal) {
  const options = shuffle([correct, ...wrongs]);
  return { mode, kind: 'mcq', prompt, media, options, answer: options.indexOf(correct), reveal };
}

const dedupeRuns = (a) => a.filter((c, i) => c !== a[i - 1]);

// ---------------------------------------------------------------- quizzes
const GEN = {
  photo(used) {
    const p = pick(withPhoto().filter((x) => !used.has(x.id)));
    used.add(p.id);
    const wrong = lookalikes(p, 3, (x) => !!PHOTOS[x.id]).map((x) => x.name);
    return mcq('photo', 'Who is this?', { type: 'photo', src: PHOTOS[p.id] }, p.name, wrong, { pid: p.id });
  },
  career(used) {
    const p = pick(pool().filter((x) => x.clubs.length >= 3 && !used.has(x.id)));
    used.add(p.id);
    const wrong = lookalikes(p, 3, (x) => x.clubs.join() !== p.clubs.join()).map((x) => x.name);
    return mcq('career', 'Whose career path is this?', { type: 'career', clubs: dedupeRuns(p.career) }, p.name, wrong, { pid: p.id });
  },
  whoami(used) {
    const p = pick(pool().filter((x) => !used.has(x.id)));
    used.add(p.id);
    const former = p.clubs.filter((c) => c !== p.club);
    const clues = [
      `Position: ${POS_NAME[p.pos]}`,
      `Born in ${p.born}`,
      `Has played for ${p.clubs.length} club${p.clubs.length > 1 ? 's' : ''}`,
      `Nationality: ${p.nation}`,
      former.length ? `Once played for ${pick(former)}` : `One-club ${p.icon ? 'legend' : 'player'}`,
      `${p.icon ? 'Last club' : 'Current club'}: ${p.club}`,
    ];
    // Prefer countrymen as decoys so the nationality clue alone doesn't give it away.
    let wrong = lookalikes(p, 3, (x) => x.nation === p.nation && x.group === p.group);
    if (wrong.length < 3) wrong = [...wrong, ...lookalikes(p, 3 - wrong.length, (x) => !wrong.includes(x))];
    return mcq('whoami', 'Who am I?', { type: 'clues', clues }, p.name, wrong.map((x) => x.name), { pid: p.id });
  },
  hl() {
    if (Math.random() < 0.7) {
      let a, b;
      do { [a, b] = sample(ACTIVE_PLAYERS, 2); } while (a.rating === b.rating);
      const higher = b.rating > a.rating;
      const q = { mode: 'hl', kind: 'mcq', prompt: `Is ${b.name}'s FC rating higher or lower than ${a.name}'s (${a.rating})?`,
        media: { type: 'hl', a: a.id, b: b.id }, options: ['Higher ⬆', 'Lower ⬇'], answer: higher ? 0 : 1, reveal: { pid: b.id } };
      return q;
    }
    let a, b;
    do { [a, b] = sample(pool(), 2); } while (a.born === b.born);
    return { mode: 'hl', kind: 'mcq', prompt: 'Who is older?', media: { type: 'vs', a: a.id, b: b.id, show: 'born' },
      options: [a.name, b.name], answer: a.born < b.born ? 0 : 1, reveal: { text: `${a.name}: ${a.born} · ${b.name}: ${b.born}` } };
  },
  rate(used) {
    const p = pick(ACTIVE_PLAYERS.filter((x) => !used.has(x.id)));
    used.add(p.id);
    return { mode: 'rate', kind: 'number', prompt: `What is ${p.name}'s FC 26 rating?`, media: { type: 'card', pid: p.id },
      min: 70, max: 95, start: 82, label: 'FC rating', answer: p.rating, reveal: { pid: p.id } };
  },
  trivia(used) {
    if (Math.random() < 0.72) {
      const pool = TRIVIA.filter((t) => !used.has(t[1]));
      const t = pick(pool.length ? pool : TRIVIA);
      used.add(t[1]);
      return mcq('trivia', t[1], { type: 'text', tag: t[0] }, t[2], t.slice(3), { text: t[2] });
    }
    const p = pick(pool().filter((x) => x.clubs.length >= 2));
    if (Math.random() < 0.5) {
      const nations = shuffle(Object.keys(NATIONS).filter((n) => n !== p.nation)).slice(0, 3);
      return mcq('trivia', `Which country ${p.icon ? 'did' : 'does'} ${p.name} represent?`, { type: 'text', tag: 'Nations', pid: p.id },
        p.nation, nations, { pid: p.id });
    }
    const big = shuffle(BIG_CLUBS.filter((c) => !p.clubs.includes(c))).slice(0, 3);
    return mcq('trivia', `Which of these clubs has ${p.name} played for?`, { type: 'text', tag: 'Clubs', pid: p.id },
      pick(p.clubs), big, { pid: p.id });
  },
  zoom(used) {
    const p = pick(withPhoto().filter((x) => !used.has(x.id)));
    used.add(p.id);
    const wrong = lookalikes(p, 3, (x) => !!PHOTOS[x.id]).map((x) => x.name);
    return mcq('zoom', 'Who is this?', { type: 'zoom', src: PHOTOS[p.id], fx: 38 + rand(24), fy: 14 + rand(20) }, p.name, wrong, { pid: p.id });
  },
  pixel(used) {
    const p = pick(withPhoto().filter((x) => !used.has(x.id)));
    used.add(p.id);
    const wrong = lookalikes(p, 3, (x) => !!PHOTOS[x.id]).map((x) => x.name);
    return mcq('pixel', 'Who is this?', { type: 'pixel', src: PHOTOS[p.id] }, p.name, wrong, { pid: p.id });
  },
  gap(used) {
    const p = pick(pool().filter((x) => x.clubs.length >= 4 && !used.has(x.id)));
    used.add(p.id);
    const path = dedupeRuns(p.career);
    const hideIdx = 1 + rand(path.length - 1);
    const missing = path[hideIdx];
    const wrong = sample(BIG_CLUBS.filter((c) => !p.clubs.includes(c)), 3);
    return mcq('gap', `${p.name}'s career has a gap. Which club is missing?`,
      { type: 'career', clubs: path.map((c, i) => (i === hideIdx ? '???' : c)) }, missing, wrong, { pid: p.id });
  },
  connection() {
    for (let t = 0; t < 600; t++) {
      const [a, b] = sample(pool(), 2);
      const shared = a.clubs.filter((c) => b.clubs.includes(c));
      if (shared.length !== 1) continue;
      const wrong = sample(BIG_CLUBS.filter((c) => !(a.clubs.includes(c) && b.clubs.includes(c))), 3);
      return mcq('connection', `Which club have both ${a.name} and ${b.name} played for?`,
        { type: 'cards', pids: [a.id, b.id], hideClub: true }, shared[0], wrong, { text: shared[0] });
    }
    return GEN.career(new Set());
  },
  squad() {
    for (let t = 0; t < 600; t++) {
      const club = pick(BIG_CLUBS);
      const members = pool().filter((p) => p.clubs.includes(club));
      if (members.length < 3) continue;
      const three = sample(members, 3);
      const common = three[0].clubs.filter((c) => three.every((p) => p.clubs.includes(c)));
      if (common.length !== 1) continue;
      const wrong = sample(BIG_CLUBS.filter((c) => c !== club), 3);
      return mcq('squad', 'All three have played for which club?', { type: 'cards', pids: three.map((p) => p.id), hideClub: true },
        club, wrong, { text: club });
    }
    return GEN.career(new Set());
  },
  oddone() {
    for (let t = 0; t < 600; t++) {
      const club = pick(BIG_CLUBS);
      const members = pool().filter((p) => p.clubs.includes(club));
      if (members.length < 3) continue;
      const three = sample(members, 3);
      const odd = lookalikes(three[0], 1, (x) => !x.clubs.includes(club))[0];
      if (!odd) continue;
      // No other trio (including the odd one) may share a club, or the answer is ambiguous.
      const ambiguous = [[0, 1], [0, 2], [1, 2]].some(([i, j]) =>
        odd.clubs.some((c) => three[i].clubs.includes(c) && three[j].clubs.includes(c)));
      if (ambiguous) continue;
      const four = shuffle([...three, odd]);
      return { mode: 'oddone', kind: 'mcq', prompt: 'Three of these played for the same club. Who is the odd one out?',
        media: { type: 'cards', pids: four.map((p) => p.id), hideClub: true }, options: four.map((p) => p.name),
        answer: four.indexOf(odd), reveal: { text: `The other three all played for ${club}` } };
    }
    return GEN.career(new Set());
  },
  initials(used) {
    const p = pick(pool().filter((x) => x.name.includes(' ') && !used.has(x.id)));
    used.add(p.id);
    const initials = p.name.split(/[\s-]+/).map((w) => w[0].toUpperCase() + '.').join(' ');
    let wrong = lookalikes(p, 3, (x) => x.nation === p.nation);
    if (wrong.length < 3) wrong = [...wrong, ...lookalikes(p, 3 - wrong.length, (x) => !wrong.includes(x))];
    return mcq('initials', 'Who has these initials?',
      { type: 'initials', initials, nation: p.nation, pos: POS_NAME[p.pos], club: p.icon ? `${p.club} (last club)` : p.club },
      p.name, wrong.map((x) => x.name), { pid: p.id });
  },
  scramble(used) {
    const p = pick(pool().filter((x) => x.name.split(' ').pop().length >= 5 && !used.has(x.id)));
    used.add(p.id);
    const sur = p.name.split(' ').pop().toUpperCase();
    let letters;
    do { letters = shuffle([...sur]).join(''); } while (letters === sur);
    const wrong = lookalikes(p, 3).map((x) => x.name);
    return mcq('scramble', 'Unscramble the surname!', { type: 'scramble', letters }, p.name, wrong, { pid: p.id });
  },
  nation3() {
    const nations = Object.keys(NATIONS).filter((n) => pool().filter((p) => p.nation === n).length >= 3);
    const n = pick(nations);
    const three = sample(pool().filter((p) => p.nation === n), 3);
    const wrong = sample(Object.keys(NATIONS).filter((x) => x !== n), 3);
    return mcq('nation3', 'All three represent which country?', { type: 'cards', pids: three.map((p) => p.id), hideFlag: true }, n, wrong, { text: n });
  },
  highest() {
    let four;
    do { four = sample(ACTIVE_PLAYERS, 4); } while (four.filter((p) => p.rating === Math.max(...four.map((x) => x.rating))).length > 1);
    const best = four.reduce((a, b) => (a.rating > b.rating ? a : b));
    return { mode: 'highest', kind: 'mcq', prompt: 'Who has the highest FC rating?', media: { type: 'cards', pids: four.map((p) => p.id), hideRating: true },
      options: four.map((p) => p.name), answer: four.indexOf(best),
      reveal: { text: four.map((p) => `${p.name.split(' ').pop()} ${p.rating}`).join(' · ') } };
  },
  youngest() {
    let four;
    do { four = sample(pool(), 4); } while (four.filter((p) => p.born === Math.max(...four.map((x) => x.born))).length > 1);
    const baby = four.reduce((a, b) => (a.born > b.born ? a : b));
    return { mode: 'youngest', kind: 'mcq', prompt: 'Who is the youngest?', media: { type: 'cards', pids: four.map((p) => p.id) },
      options: four.map((p) => p.name), answer: four.indexOf(baby),
      reveal: { text: four.map((p) => `${p.name.split(' ').pop()} ${p.born}`).join(' · ') } };
  },
  born(used) {
    const p = pick(pool().filter((x) => !used.has(x.id)));
    used.add(p.id);
    return { mode: 'born', kind: 'number', prompt: `What year was ${p.name} born?`, media: { type: 'card', pid: p.id, showRating: true },
      min: p.icon ? 1925 : 1983, max: p.icon ? 1995 : 2008, start: p.icon ? 1970 : 1998, label: 'Born', answer: p.born, reveal: { pid: p.id } };
  },
  tf(used) {
    const truth = Math.random() < 0.5;
    const r = Math.random();
    let text;
    if (r < 0.3) {
      const t = pick(TRIVIA.filter((x) => !used.has(x[1])));
      used.add(t[1]);
      text = `${t[1]} → ${truth ? t[2] : pick(t.slice(3))}`;
    } else {
      const p = pick(pool().filter((x) => x.clubs.length >= 2));
      if (r < 0.6) {
        const club = truth ? pick(p.clubs) : pick(BIG_CLUBS.filter((c) => !p.clubs.includes(c)));
        text = `${p.name} has played for ${club}.`;
      } else if (r < 0.75) {
        const nat = truth ? p.nation : pick(Object.keys(NATIONS).filter((n) => n !== p.nation));
        text = `${p.name} represents ${nat}.`;
      } else if (r < 0.88) {
        const y = truth ? p.born : p.born + pick([-3, -2, -1, 1, 2, 3]);
        text = `${p.name} was born in ${y}.`;
      } else {
        const pos = truth ? p.pos : pick(Object.keys(POS_NAME).filter((x) => POS_NAME[x] !== POS_NAME[p.pos]));
        text = `${p.name} is a ${POS_NAME[pos].toLowerCase()}.`;
      }
    }
    return { mode: 'tf', kind: 'mcq', prompt: text, media: { type: 'text', tag: 'True or false?' }, options: ['True ✅', 'False ❌'],
      answer: truth ? 0 : 1, reveal: { text: truth ? 'TRUE' : 'FALSE' } };
  },
  flags(used) {
    const n = pick(Object.keys(FLAGS).filter((x) => !used.has(x)));
    used.add(n);
    const wrong = sample(Object.keys(FLAGS).filter((x) => x !== n), 3);
    return mcq('flags', 'Which football nation is this?', { type: 'flag', iso: FLAGS[n] }, n, wrong, { text: n });
  },
};

// Flag Frenzy: player nations plus other World Cup / continental regulars.
export const FLAGS = {
  ...NATIONS,
  'Mexico': 'mx', 'Costa Rica': 'cr', 'Panama': 'pa', 'Jamaica': 'jm', 'Chile': 'cl', 'Peru': 'pe', 'Paraguay': 'py',
  'Venezuela': 've', 'Bolivia': 'bo', 'Australia': 'au', 'New Zealand': 'nz', 'Saudi Arabia': 'sa', 'Iran': 'ir',
  'Qatar': 'qa', 'Iraq': 'iq', 'Tunisia': 'tn', 'South Africa': 'za', 'Mali': 'ml', 'Burkina Faso': 'bf',
  'Austria': 'at', 'Finland': 'fi', 'Iceland': 'is', 'Romania': 'ro', 'Slovakia': 'sk', 'Albania': 'al',
  'Greece': 'gr', 'Bosnia and Herzegovina': 'ba', 'North Macedonia': 'mk', 'Northern Ireland': 'gb-nir',
  'Uzbekistan': 'uz', 'Jordan': 'jo', 'Cape Verde': 'cv', 'Haiti': 'ht', 'Curaçao': 'cw', 'Honduras': 'hn',
};

// ---------------------------------------------------------------- Footle & Name Them All
export function footlePick() {
  const cands = pool().filter((p) => p.rating >= 82 || p.icon);
  return pick(cands).id;
}

// Per-column hint for a Footle guess vs the mystery player: 'hit' | 'near' | 'miss' (+ arrow for numbers).
export function footleHints(guess, target) {
  const g = P(guess), t = P(target);
  const num = (a, b, near) => ({ v: a, st: a === b ? 'hit' : Math.abs(a - b) <= near ? 'near' : 'miss', dir: a === b ? '' : a < b ? '↑' : '↓' });
  return {
    nation: { v: g.nation, st: g.nation === t.nation ? 'hit' : 'miss' },
    pos: { v: g.pos, st: g.pos === t.pos ? 'hit' : g.group === t.group ? 'near' : 'miss' },
    club: { v: g.icon ? 'Icon' : g.club, st: !g.icon && !t.icon && g.club === t.club ? 'hit' : t.clubs.includes(g.club) ? 'near' : 'miss' },
    born: num(g.born, t.born, 2),
    rating: num(g.rating, t.rating, 2),
  };
}

export function nameAllCriterion() {
  const counts = {};
  for (const p of pool()) {
    p.clubs.forEach((c) => { counts['club|' + c] = (counts['club|' + c] || 0) + 1; });
    counts['nation|' + p.nation] = (counts['nation|' + p.nation] || 0) + 1;
  }
  const [type, v] = pick(Object.keys(counts).filter((k) => counts[k] >= 10)).split('|');
  return { type, v, total: counts[type + '|' + v] };
}

const clubCount = {};
PLAYERS.forEach((p) => p.clubs.forEach((c) => { clubCount[c] = (clubCount[c] || 0) + 1; }));
const BIG_CLUBS = Object.keys(clubCount).filter((c) => clubCount[c] >= 6);

export function makeQuestions(mode, n) {
  const used = new Set();
  const qs = [];
  const mixKinds = shuffle(['photo', 'career', 'whoami', 'hl', 'trivia', 'rate', 'zoom', 'gap', 'connection', 'squad',
    'oddone', 'initials', 'scramble', 'nation3', 'highest', 'youngest', 'born', 'tf', 'flags', 'pixel']);
  for (let i = 0; i < n; i++) {
    const kind = mode === 'mixed' ? mixKinds[i % mixKinds.length] : mode;
    qs.push(GEN[kind](used));
  }
  return mode === 'mixed' ? shuffle(qs) : qs;
}

export function scoreAnswer(q, a, msLeft, durMs) {
  if (a == null) return { ok: false, pts: 0 };
  const speed = clamp(msLeft / durMs, 0, 1);
  if (q.kind === 'number') {
    const d = Math.abs(a - q.answer);
    const base = [1000, 750, 500, 300, 150, 60][d] || 0;
    return { ok: d <= 2, pts: Math.round(base * (0.85 + 0.15 * speed)), diff: d };
  }
  const ok = a === q.answer;
  return { ok, pts: ok ? Math.round(400 + 600 * speed) : 0 };
}

// ---------------------------------------------------------------- $20 draft
export const DRAFT_SLOTS = [
  { key: 'GK', pos: ['GK'], x: 50, y: 90 },
  { key: 'RB', pos: ['RB'], x: 84, y: 70 },
  { key: 'CB', pos: ['CB'], x: 62, y: 74 },
  { key: 'CB', pos: ['CB'], x: 38, y: 74 },
  { key: 'LB', pos: ['LB'], x: 16, y: 70 },
  { key: 'CM', pos: ['CDM', 'CM'], x: 50, y: 52 },
  { key: 'CM', pos: ['CM', 'CDM', 'CAM'], x: 74, y: 44 },
  { key: 'CM', pos: ['CAM', 'CM'], x: 26, y: 44 },
  { key: 'RW', pos: ['RW'], x: 82, y: 20 },
  { key: 'ST', pos: ['ST'], x: 50, y: 13 },
  { key: 'LW', pos: ['LW'], x: 18, y: 20 },
];

// Price tiers are rating quantiles inside each slot's pool, so every
// position always has a $1 bargain and a $5 superstar.
function priced(slot, icons) {
  const pool = PLAYERS.filter((p) => slot.pos.includes(p.pos) && (icons || !p.icon))
    .sort((a, b) => b.rating - a.rating);
  const cuts = [0.12, 0.3, 0.52, 0.76, 1];
  return pool.map((p, i) => ({ pid: p.id, price: 5 - cuts.findIndex((c) => i < Math.ceil(c * pool.length)) }));
}

export function draftOptions(slotIdx, used) {
  const pool = priced(DRAFT_SLOTS[slotIdx], ICONS_ON).filter((o) => !used.has(o.pid));
  const opts = [];
  for (let price = 1; price <= 5; price++) {
    const tier = pool.filter((o) => o.price === price && !opts.some((x) => x.pid === o.pid));
    const o = tier.length ? pick(tier) : null;
    if (o) opts.push(o);
  }
  opts.forEach((o) => used.add(o.pid));
  return opts;
}

export const canAfford = (price, budget, slotsLeftAfter) => price <= budget - slotsLeftAfter;

export function aiPick(options, budget, slotsLeftAfter, style = 'balanced') {
  const ok = options.filter((o) => canAfford(o.price, budget, slotsLeftAfter));
  if (!ok.length) return options.reduce((a, b) => (a.price <= b.price ? a : b));
  const target = budget / (slotsLeftAfter + 1);
  const bias = style === 'baller' ? 1.6 : style === 'saver' ? 0.7 : 1;
  return weighted(ok, (o) => 1 / (0.4 + Math.abs(o.price - target * bias)) + (o.price === 5 && style === 'baller' ? 1 : 0));
}

export function teamStats(pids) {
  const ps = pids.map(P);
  const avg = (arr) => arr.reduce((s, p) => s + p.rating, 0) / Math.max(1, arr.length);
  let chem = 0;
  ps.forEach((p) => {
    const links = ps.filter((q) => q !== p && (q.nation === p.nation || (!p.icon && !q.icon && q.club === p.club))).length;
    chem += Math.min(3, links);
  });
  const chemBoost = (chem / 33) * 3;
  const def = avg(ps.slice(0, 5)) + chemBoost;
  const att = avg(ps.slice(5)) + chemBoost;
  const ovr = Math.round(avg(ps) + chemBoost);
  return { ovr, chem, att: +att.toFixed(1), def: +def.toFixed(1) };
}

const SCORE_W = { ST: 6, LW: 4, RW: 4, CAM: 3, CM: 1.8, CDM: 1, LB: 0.6, RB: 0.6, CB: 0.5, GK: 0 };

function simMatch(A, B) {
  const lam = (att, def) => clamp(1.35 * Math.exp((att - def) / 6.5), 0.25, 4.5);
  const goals = [poisson(lam(A.stats.att, B.stats.def)), poisson(lam(B.stats.att, A.stats.def))];
  const events = [];
  [A, B].forEach((T, side) => {
    for (let g = 0; g < goals[side]; g++) {
      const pid = weighted(T.pids, (id) => SCORE_W[P(id).pos] * Math.max(1, P(id).rating - 65));
      events.push({ side, pid, min: 1 + rand(90) });
    }
  });
  events.sort((a, b) => a.min - b.min);
  return { a: A.id, b: B.id, ga: goals[0], gb: goals[1], events };
}

export function runLeague(teams) {
  teams.forEach((t) => { t.stats = teamStats(t.pids); });
  const table = Object.fromEntries(teams.map((t) => [t.id, { id: t.id, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0, Pts: 0 }]));
  const matches = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const m = simMatch(teams[i], teams[j]);
      matches.push(m);
      const ta = table[m.a], tb = table[m.b];
      ta.P++; tb.P++; ta.GF += m.ga; ta.GA += m.gb; tb.GF += m.gb; tb.GA += m.ga;
      if (m.ga > m.gb) { ta.W++; tb.L++; ta.Pts += 3; } else if (m.ga < m.gb) { tb.W++; ta.L++; tb.Pts += 3; } else { ta.D++; tb.D++; ta.Pts++; tb.Pts++; }
    }
  }
  const standings = Object.values(table).sort((x, y) => y.Pts - x.Pts || (y.GF - y.GA) - (x.GF - x.GA) || y.GF - x.GF);
  const goals = {};
  matches.forEach((m) => m.events.forEach((e) => { goals[e.pid] = (goals[e.pid] || 0) + 1; }));
  const topScorers = Object.entries(goals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return { matches: shuffle(matches), standings, topScorers };
}

export const AI_TEAMS = [
  ['Sunday League FC', 'saver'], ['Galácticos XI', 'baller'], ['Pub Ballers', 'balanced'],
  ['Moneyball United', 'saver'], ['Tiki-Taka Town', 'balanced'], ['Bottle Job Rovers', 'baller'],
];

// ---------------------------------------------------------------- grid
const nationCount = {};
PLAYERS.forEach((p) => { nationCount[p.nation] = (nationCount[p.nation] || 0) + 1; });
const GRID_CLUBS = Object.keys(clubCount).filter((c) => clubCount[c] >= 7);
const GRID_NATIONS = Object.keys(nationCount).filter((n) => nationCount[n] >= 8);

export const fits = (p, crit) => (crit.type === 'club' ? p.clubs.includes(crit.v) : p.nation === crit.v);
export const answersFor = (r, c) => pool().filter((p) => fits(p, r) && fits(p, c));

export function makeGrid() {
  // Pick 3 column clubs, then keep every row criterion that works for all
  // three columns, and draw the rows from those (at most 2 nations).
  const allRows = [...GRID_NATIONS.map((v) => ({ type: 'nation', v })), ...GRID_CLUBS.map((v) => ({ type: 'club', v }))];
  let best = null;
  for (let tries = 0; tries < 3000; tries++) {
    const cols = sample(GRID_CLUBS, 3).map((v) => ({ type: 'club', v }));
    const need = tries < 1500 ? 2 : 1;
    const ok = allRows.filter((r) => !cols.some((c) => c.v === r.v) && cols.every((c) => answersFor(r, c).length >= need));
    const nations = shuffle(ok.filter((r) => r.type === 'nation'));
    const clubs = shuffle(ok.filter((r) => r.type === 'club'));
    const nN = Math.min(nations.length, rand(3));
    if (nN + clubs.length < 3) continue;
    const rows = [...nations.slice(0, nN), ...clubs.slice(0, 3 - nN)];
    best = { rows: shuffle(rows), cols };
    break;
  }
  if (!best) throw new Error('grid generation failed');
  return best;
}

// Rarer (lower-rated) correct answers are worth more.
export const gridPoints = (pid) => 100 + Math.max(0, 96 - P(pid).rating) * 10;
