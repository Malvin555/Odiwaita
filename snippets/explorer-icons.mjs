const sections = [
  ['Notes', 'note', 'var(--color-blue)'], ['Journal', 'calendar', 'var(--color-purple)'], ['Diary', 'edit', 'var(--color-pink)'],
  ['Planner', 'list', 'var(--color-green)'], ['Reminders', 'alarm', 'var(--color-orange)'],
  ['Important', 'important', 'var(--color-red)'], ['Self', 'person', 'var(--color-cyan)'],
  ['Private', 'lock', 'var(--color-yellow)'], ['System', 'settings', 'var(--text-faint)'],
];
const sub = [
  ['Journal/Daily', 'sun'], ['Journal/Weekly', 'calendar'], ['Journal/Monthly', 'calendar'],
  ['Planner/Projects', 'tools'], ['Planner/Goals', 'flag'], ['Important/Items', 'important'],
  ['Important/Contacts', 'contact'], ['Self/Learning', 'science'], ['Self/Ideas', 'star'],
  ['Private/Accounts', 'password'], ['Private/Secure Notes', 'lock'],
  ['System/Templates', 'newdoc'], ['System/Attachments', 'pictures'],
];

const folder = (p) => `.nav-folder-title[data-path="${p}"]`;
const folderTree = (p) => `.nav-folder-title[data-path^="${p}/"]`;
const filesIn = (p) => `.nav-file-title[data-path^="${p}/"]`;
const file = (p) => `.nav-file-title[data-path="${p}"]`;
const mask = (icon) => `-webkit-mask-image: var(--adw-i-${icon}); mask-image: var(--adw-i-${icon});`;

function rule(folderSel, fileSel, icon, color) {
  const bg = color ? `\n  background-color: ${color};` : '';
  let out = '';
  for (const [sels, suffix] of [[folderSel, '.nav-folder-title-content'], [fileSel, '.nav-file-title-content']]) {
    if (!sels) continue;
    const joined = sels.map((s) => `${s} ${suffix}::before`).join(',\n');
    out += `${joined} {\n  ${mask(icon)}${bg}\n}\n`;
  }
  return out;
}

export default function explorerIcons(vars) {
  let css = `:root {\n${vars}\n}\n
.nav-folder-title-content::before,
.nav-file-title-content::before {
  content: "";
  display: inline-block;
  width: 15px;
  height: 15px;
  margin-right: 7px;
  vertical-align: -2px;
  background-color: var(--text-muted);
  -webkit-mask-size: contain;
  mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
  -webkit-mask-position: center;
  mask-position: center;
}
.nav-folder-title-content::before { ${mask('folder')} }
.nav-file-title-content::before { ${mask('doc')} opacity: 0.7; width: 14px; height: 14px; }
`;
  for (const [p, icon, color] of sections) css += rule([folder(p), folderTree(p)], [filesIn(p)], icon, color);
  for (const [p, icon] of sub) css += rule([folder(p), folderTree(p)], [filesIn(p)], icon);
  css += rule(null, [file('Home.md')], 'home', 'var(--color-blue)');
  css += rule(null, [file('Planner/Tasks.md')], 'check');
  css += rule(null, [file('Planner/Board.md')], 'grid');
  css += `.nav-file-title[data-path$=".base"] .nav-file-title-content::before { ${mask('search')} }
.nav-file-title[data-path$=".canvas"] .nav-file-title-content::before { ${mask('grid')} }
.nav-file-title.is-active .nav-file-title-content::before { opacity: 1; }
`;
  return css;
}
