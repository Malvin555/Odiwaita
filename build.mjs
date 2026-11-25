import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync, watch } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import explorerIcons from './snippets/explorer-icons.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const p = (...a) => join(root, ...a);
const read = (...a) => readFileSync(p(...a), 'utf8');

const ORDER = ['base', 'layout', 'controls', 'overlays', 'content', 'plugins', 'linux'];
const FIRST = ['base/root.css', 'base/colors.css', 'base/obsidian.css', 'base/typography.css'];

const GATES = { mod: 'adwaita-mod', tabs: 'adwaita-tabs', colors: 'adwaita-colors', font: 'adwaita-font', icons: 'adwaita-icons' };
const gate = (c) => `:is(body:not(.${c}-always, .${c}-linux-only, .${c}-never).mod-linux, body.${c}-always, body.${c}-linux-only.mod-linux)`;

const ACCENTS = {
  blue: ['#3584e4', '#ffffff'], teal: ['#2190a4', '#ffffff'], green: ['#3a944a', '#ffffff'],
  yellow: ['#c88800', 'rgb(0 0 0 / 80%)'], orange: ['#ed5b00', '#ffffff'], red: ['#e62d42', '#ffffff'],
  pink: ['#d56199', '#ffffff'], purple: ['#9141ac', '#ffffff'], slate: ['#6f8396', '#ffffff'],
};

const dataUri = (file) => `url("data:image/svg+xml;base64,${readFileSync(file).toString('base64')}")`;
const svgs = (dir) => readdirSync(p(dir)).filter((f) => f.endsWith('.svg')).sort();

function sources() {
  const all = ORDER.flatMap((d) => readdirSync(p('src', d)).filter((f) => f.endsWith('.css')).sort().map((f) => `${d}/${f}`));
  return [...FIRST, ...all.filter((f) => !FIRST.includes(f))];
}

function expand(css) {
  return css.replace(/%(\w+)%/g, (_, k) => {
    if (!GATES[k]) throw new Error(`unknown macro %${k}%`);
    return gate(GATES[k]);
  });
}

function generated() {
  const accents = Object.entries(ACCENTS)
    .map(([n, [bg, fg]]) => `body.adw-accent-${n} { --adw-accent-bg-color: ${bg}; --adw-accent-fg-color: ${fg}; }`)
    .join('\n');
  const icons = svgs('assets/icons/chrome')
    .map((f) => `  --adw-icon-${basename(f, '.svg')}-symbolic: ${dataUri(p('assets/icons/chrome', f))};`)
    .join('\n');
  return `${accents}\n:root {\n${icons}\n}`;
}

function strip(css, from) {
  const root = postcss.parse(css, { from });
  root.walkComments((c) => c.remove());
  return root.toString().replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

function build() {
  const body = sources().map((f) => read('src', f)).join('\n') + '\n' + generated();
  const css = strip(expand(body), 'src');
  const settings = read('src/settings.yml').trim();
  const out = `/* @settings\n${settings}\n*/\n\n${css}`;
  rmSync(p('dist'), { recursive: true, force: true });
  mkdirSync(p('dist/snippets'), { recursive: true });
  writeFileSync(p('dist/theme.css'), out);
  writeFileSync(p('dist/manifest.json'), read('manifest.json'));

  const iconVars = svgs('assets/icons/explorer')
    .map((f) => `  --adw-i-${basename(f, '.svg')}: ${dataUri(p('assets/icons/explorer', f))};`)
    .join('\n');
  writeFileSync(p('dist/snippets/explorer-icons.css'), strip(explorerIcons(iconVars), 'explorer'));
  writeFileSync(p('dist/snippets/vault-layout.css'), strip(read('snippets/vault-layout.css'), 'layout'));
  console.log(`built dist/theme.css (${(out.length / 1024).toFixed(1)} KiB)`);
}

build();
if (process.argv.includes('--watch')) {
  for (const d of ['src', 'snippets', 'assets']) watch(p(d), { recursive: true }, () => { try { build(); } catch (e) { console.error(e.message); } });
}
