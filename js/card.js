import { NATIONS, P, shortName } from './data.js?v=mui1zywn';
import { PHOTOS } from './photos.js?v=mui1zywn';
import { esc } from './util.js?v=mui1zywn';

const SILHOUETTE = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 120"><circle cx="50" cy="42" r="22" fill="#0006"/><path d="M8 120c4-30 22-44 42-44s38 14 42 44z" fill="#0006"/></svg>`);

export const photoOf = (p) => (p && PHOTOS[p.id]) || SILHOUETTE;
export const hasPhoto = (p) => !!PHOTOS[p.id];
export const flagUrl = (nation) => `https://flagcdn.com/w80/${NATIONS[nation] || 'un'}.png`;
export const flagImg = (nation, cls = 'flag') =>
  `<img class="${cls}" src="${flagUrl(nation)}" alt="${esc(nation)}" title="${esc(nation)}" loading="lazy">`;

export function tierOf(p) {
  if (p.icon) return 'icon';
  if (p.rating >= 88) return 'elite';
  if (p.rating >= 83) return 'gold';
  return 'silver';
}

/**
 * FC-style player card with a real photo.
 * opts: { hideRating, hideName, hideClub, blur, price, size: 'sm'|'md'|'lg', extraClass, badge }
 */
export function cardHTML(pOrId, opts = {}) {
  const p = typeof pOrId === 'string' ? P(pOrId) : pOrId;
  if (!p) return '';
  const tier = tierOf(p);
  const cls = ['fc-card', `tier-${tier}`, `sz-${opts.size || 'md'}`, opts.extraClass || ''].join(' ');
  const rating = opts.hideRating ? '?' : p.rating;
  const name = opts.hideName ? '???' : shortName(p);
  const club = opts.hideClub ? '' : (p.icon ? 'ICON' : p.club);
  return `<div class="${cls}" data-pid="${p.id}">
    <div class="fc-shine"></div>
    <div class="fc-top">
      <div class="fc-rating${opts.hideRating ? ' hidden-val' : ''}">${rating}</div>
      <div class="fc-pos">${p.pos}</div>
      ${opts.hideFlag ? '<div class="fc-flag mystery-flag">?</div>' : flagImg(p.nation, 'fc-flag')}
    </div>
    <div class="fc-photo${opts.blur ? ' blurred' : ''}"><img src="${photoOf(p)}" alt="" referrerpolicy="no-referrer" loading="lazy" onerror="this.src='${SILHOUETTE}'"></div>
    <div class="fc-name">${esc(name)}</div>
    <div class="fc-club">${esc(club)}</div>
    ${opts.price != null ? `<div class="fc-price">$${opts.price}</div>` : ''}
    ${opts.badge ? `<div class="fc-badge">${esc(opts.badge)}</div>` : ''}
  </div>`;
}
