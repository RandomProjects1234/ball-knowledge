// $20 auction draft: a random player goes under the hammer and managers bid on
// him, either taking turns (raise or pass) or with secret sealed bids. Highest
// bid wins. Everyone builds a 5-a-side team: GK, CB, CM, ST, ST. When all teams
// are full, the higher team rating wins. Pure logic, run by the host.
import { P } from './data.js?v=mui1zywn';
import { pool } from './modes.js?v=mui1zywn';
import { weighted, clamp } from './util.js?v=mui1zywn';

export const FIVE_SLOTS = [
  { key: 'GK', label: 'GK', x: 50, y: 86 },
  { key: 'CB', label: 'CB', x: 50, y: 64 },
  { key: 'CM', label: 'CM', x: 50, y: 42 },
  { key: 'ST1', label: 'ST', x: 30, y: 17 },
  { key: 'ST2', label: 'ST', x: 70, y: 17 },
];

// Which kind of player each slot takes. ST slots accept wingers too, so the
// Messis and Viníciuses of the world still come up for auction.
const FITS = {
  GK: (p) => p.pos === 'GK',
  CB: (p) => p.pos === 'CB',
  CM: (p) => p.group === 'MID',
  ST1: (p) => p.group === 'FWD',
  ST2: (p) => p.group === 'FWD',
};
const KIND = { GK: 'GK', CB: 'CB', CM: 'CM', ST1: 'ST', ST2: 'ST' };

export const newTeam = (id, name, human, budget) =>
  ({ id, name, human, budget, slots: { GK: null, CB: null, CM: null, ST1: null, ST2: null }, paid: {} });

export const openSlots = (t) => Object.values(t.slots).filter((v) => !v).length;
export const isFull = (t) => openSlots(t) === 0;

export function slotFor(t, pid) {
  const p = P(pid);
  return Object.keys(t.slots).find((k) => !t.slots[k] && FITS[k](p)) || null;
}

// Always keep $1 for every other empty slot.
export const maxBid = (t) => t.budget - (openSlots(t) - 1);

export function nextLotPlayer(teams, used) {
  const need = {};
  for (const t of teams) for (const k of Object.keys(t.slots)) if (!t.slots[k]) need[k] = (need[k] || 0) + 1;
  const kinds = Object.keys(need);
  if (!kinds.length) return null;
  const k = weighted(kinds, (x) => need[x]);
  const cands = pool().filter((p) => FITS[k](p) && !used.has(p.id));
  // Lean towards famous players so lots are exciting, with some bargains mixed in.
  return weighted(cands, (p) => (1 + Math.max(0, Math.min(p.rating, 91) - 76) ** 1.5) * (p.icon ? 0.45 : 1)).id;
}

export const slotKind = (k) => KIND[k];

// What an AI manager thinks a player is worth to it right now.
export function aiValue(t, pid, style) {
  const p = P(pid);
  const base = clamp((p.rating - 77) * 0.85, 1, 14);
  const fair = (t.budget / openSlots(t)) * (style === 'baller' ? 2.4 : style === 'saver' ? 1.4 : 1.9);
  const v = Math.min(base, fair, maxBid(t));
  return Math.max(1, Math.round(v + (Math.random() * 2 - 1)));
}

export function teamRating(t) {
  const ps = Object.values(t.slots).filter(Boolean).map(P);
  const total = ps.reduce((s, p) => s + p.rating, 0);
  return { avg: ps.length ? +(total / ps.length).toFixed(1) : 0, total, best: Math.max(0, ...ps.map((p) => p.rating)) };
}

// Higher average rating wins; ties go to the higher-rated best player.
export function rankTeams(teams) {
  return teams.map((t) => ({ id: t.id, ...teamRating(t) }))
    .sort((a, b) => b.total - a.total || b.best - a.best);
}

export const AI_MANAGERS = [['Agent Bot', 'balanced'], ['Big Spender Bot', 'baller'], ['Tight Wallet Bot', 'saver']];
