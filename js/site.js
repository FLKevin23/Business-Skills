/* Business Skills Lernhub: nav, theme, storage, schedule */

const Store = {
  get(k, d) { try { const v = localStorage.getItem('bs.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('bs.' + k, JSON.stringify(v)); } catch (e) {} }
};

/* ── Theme ── */
(function () {
  const t = Store.get('theme', null);
  if (t) document.documentElement.setAttribute('data-theme', t);
})();

/* ── Schedule (from the Stoffplaene + OpenOlat Termine, Stand 27.10.2026) ── */
const SCHEDULE = [
  { d: '2026-10-21', s: 'bwl', ke: 1, t: 'Umwelt der Unternehmung & Gliederung der Betriebe', k: 'Kap. 1 & 2', page: 'bwl/ke1.html' },
  { d: '2026-10-21', s: 'recht', ke: 1, t: 'Grundlagen des Rechts, Obligationen, Haftpflicht', k: 'Kap. 14 (+ Vorgriff 15.1)', page: 'recht/ke1.html' },
  { d: '2026-10-28', time: '08:30', s: 'bwl', ke: 2, t: 'Leitbild, Strategie, Unternehmenskonzept; Bedürfnisse & Güter', k: 'Kap. 3 & 4', page: 'bwl/ke2.html' },
  { d: '2026-10-28', time: '12:30', s: 'recht', ke: 2, t: 'Obligation & Allgemeine Vertragslehre', k: 'Kap. 15', page: 'recht/vorschau.html#ke2' },
  { d: '2026-11-04', time: '08:30', s: 'recht', ke: 3, t: 'Kaufvertrag (Fahrniskauf)', k: 'Kap. 16', page: 'recht/vorschau.html#ke3' },
  { d: '2026-11-04', time: '12:30', s: 'bwl', ke: 3, t: 'ZWISCHENPRÜFUNG (Kap. 1 bis 4) + Aufbau-/Ablauforganisation', k: 'Kap. 11', exam: true, page: 'bwl/zp.html' },
  { d: '2026-11-11', time: '08:30', s: 'recht', ke: 4, t: 'Kaufvertrag Fortsetzung', k: 'Kap. 16' },
  { d: '2026-11-11', time: '12:30', s: 'bwl', ke: 4, t: 'Besprechung ZP; Versicherung & Risikomanagement', k: 'Kap. 12.1 bis 12.2' },
  { d: '2026-11-18', time: '08:30', s: 'recht', ke: 5, t: 'ZWISCHENPRÜFUNG (Kap. 14 bis 16) + Arbeitsvertrag', k: 'Kap. 17.1 bis 17.2', exam: true },
  { d: '2026-11-25', time: '08:30', s: 'recht', ke: 6, t: 'Besprechung ZP; Lehrvertrag, GAV/NAV, Werkvertrag, Auftrag', k: 'Kap. 17.3 bis 17.6' },
  { d: '2026-11-25', time: '12:30', s: 'bwl', ke: 5, t: 'Versicherungen (Arten, Abschluss, Personen/Sach/Vermögen)', k: 'Kap. 12.3 bis 12.8' },
  { d: '2026-12-02', time: '08:30', s: 'recht', ke: 7, t: 'Miete, Leasing, Gebrauchsleihe, Darlehen, Pacht', k: 'Kap. 18 · Hausaufgabe: Nullserie' },
  { d: '2026-12-02', time: '12:30', s: 'bwl', ke: 6, t: 'Marketing: Marktuntersuchung, Produkt/Markt, 4P', k: 'Kap. 13 · Hausaufgabe: Nullserie' },
  { d: '2026-12-09', time: '08:30', s: 'recht', ke: 8, t: 'Besprechung Nullserie, Repetition', k: '' },
  { d: '2026-12-09', time: '12:30', s: 'bwl', ke: 7, t: 'Besprechung Nullserie, Gesamtrepetition', k: '' },
  { d: '2026-12-16', time: '08:30', s: 'recht', ke: 9, t: 'MODULPRÜFUNG Recht (120 Min., ZGB/OR erlaubt)', k: '', exam: true, page: 'recht/nullserie.html' },
  { d: '2026-12-16', time: '11:30', s: 'bwl', ke: 8, t: 'MODULPRÜFUNG BWL (120 Min., Taschenrechner)', k: '', exam: true, page: 'bwl/nullserie.html' }
];

/* Every quiz on the site, for the progress overview */
const QUIZZES = [
  { id: 'bwl-ke1', t: 'BWL KE1 Check', url: 'bwl/ke1.html#check', s: 'bwl' },
  { id: 'bwl-ke2', t: 'BWL KE2 Check', url: 'bwl/ke2.html#check', s: 'bwl' },
  { id: 'bwl-zp', t: 'BWL Zwischenprüfung (Probe)', url: 'bwl/zp.html', s: 'bwl' },
  { id: 'bwl-null', t: 'BWL Nullserie', url: 'bwl/nullserie.html', s: 'bwl' },
  { id: 'recht-ke1', t: 'Recht KE1 Check', url: 'recht/ke1.html#check', s: 'recht' },
  { id: 'recht-null', t: 'Recht Nullserie', url: 'recht/nullserie.html', s: 'recht' }
];

function todayISO() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function daysUntil(iso) { const a = new Date(todayISO() + 'T00:00:00'), b = new Date(iso + 'T00:00:00'); return Math.round((b - a) / 86400000); }
function fmtDate(iso) { const [y, m, d] = iso.split('-'); const wd = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date(iso + 'T00:00:00').getDay()]; return wd + ' ' + d + '.' + m + '.'; }

/* ── Nav ── */
function renderNav() {
  const base = document.body.dataset.base || '';
  const page = document.body.dataset.page || '';
  const items = [
    ['index.html', 'Übersicht', 'home'],
    ['bwl/ke1.html', 'BWL KE1', 'bwl-ke1'],
    ['bwl/ke2.html', 'BWL KE2', 'bwl-ke2'],
    ['recht/ke1.html', 'Recht KE1', 'recht-ke1'],
    ['recht/vorschau.html', 'Recht Vorschau', 'recht-vorschau'],
    ['karten.html', '🃏 Karteikarten', 'karten'],
    ['pruefungen.html', '📝 Prüfungen', 'pruefungen']
  ];
  const nav = document.createElement('div');
  nav.className = 'topnav';
  nav.innerHTML = '<a class="brand" href="' + base + 'index.html">Business Skills <span>Lernhub</span></a><nav>' +
    items.map(i => '<a href="' + base + i[0] + '"' + (i[2] === page ? ' class="active"' : '') + '>' + i[1] + '</a>').join('') +
    '</nav><button class="theme-btn" title="Hell/Dunkel">◐</button>';
  document.body.prepend(nav);
  nav.querySelector('.theme-btn').onclick = () => {
    const cur = document.documentElement.getAttribute('data-theme') ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    Store.set('theme', next);
  };
  const f = document.createElement('footer');
  f.innerHTML = 'Handelsdiplom VSH · BVS St. Gallen · Business Skills I (BWL) & II (Recht) · Lernfortschritt wird nur in diesem Browser gespeichert.';
  document.body.append(f);
}
document.addEventListener('DOMContentLoaded', renderNav);
