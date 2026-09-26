// Cache-buster: stamps ?v=<version> onto every module import and the entry
// script, so a GitHub Pages update never mixes cached old modules with new ones.
//   node tools/bump.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const v = Date.now().toString(36);
const stamp = (s) => s.replace(/((?:from|import)\s*\(?\s*['"]\.\/[\w-]+\.js)(\?v=\w+)?(['"])/g, `$1?v=${v}$3`);

for (const f of readdirSync(new URL('js/', root))) {
  if (!f.endsWith('.js')) continue;
  const u = new URL('js/' + f, root);
  writeFileSync(u, stamp(readFileSync(u, 'utf8')));
}
const idx = new URL('index.html', root);
writeFileSync(idx, readFileSync(idx, 'utf8')
  .replace(/js\/main\.js(\?v=\w+)?/, `js/main.js?v=${v}`)
  .replace(/style\.css(\?v=\w+)?/, `style.css?v=${v}`));
console.log('stamped version', v);
