#!/usr/bin/env node
/*
  Stellt den Ordner "dist/" zusammen, der veroeffentlicht wird.

  Warum ueberhaupt ein Build-Schritt, obwohl die Seite statisch ist?
  Weil sonst das komplette Repository oeffentlich im Netz stuende - also auch
  "docs/" (interne Anleitungen, Launch-Plan), "scripts/", "cms/", "TODO.md"
  und vor allem "original-site/" (eine Kopie der alten Website, urheberrechtlich
  heikel). Alles davon waere unter der echten Domain abrufbar, z. B. als
  zierfischparadies-erding.de/docs/launch-checkliste.md, und koennte von Google
  indexiert werden.

  Deshalb: ausdrueckliche Positivliste. Es wird nur veroeffentlicht, was hier
  bewusst aufgefuehrt ist.

  Verwendung: npm run build-site   (laeuft auf Netlify automatisch)
*/
import { cp, rm, mkdir, readdir, stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Nur diese Dateien/Ordner gehen online. Neue oeffentliche Datei? Hier eintragen.
const PUBLIC_ENTRIES = [
  'index.html',
  'shop.html',
  'impressum.html',
  'datenschutz.html',
  '404.html',
  'robots.txt',
  'sitemap.xml',
  '_redirects',
  'assets',
  'content'
];

/*
  In assets/images/ liegen neben den ausgelieferten Varianten auch die
  unbearbeiteten Original-Fotos (z. B. about-joachim.jpg mit 6,9 MB). Die
  braucht nur scripts/optimize-images.mjs als Quelle - im Netz haben sie
  nichts verloren: Sie werden nirgends referenziert, waeren aber trotzdem
  oeffentlich abrufbar und haben das Deployment von 108 MB auf ein Vielfaches
  der noetigen Groesse aufgeblaeht.

  Ausgeliefert wird deshalb nur, was eine Breitenangabe traegt
  (-480/-960/-1600) - plus og.jpg, das bewusst als 1200x630-Vorschaubild
  fuers Teilen existiert und keine Breitenvariante hat.
*/
const BILD_VARIANTE = /-(480|960|1600)\.(avif|webp|jpg)$/i;
const BILD_AUSNAHMEN = new Set(['og.jpg']);

function bildWirdVeroeffentlicht(name) {
  return BILD_VARIANTE.test(name) || BILD_AUSNAHMEN.has(name);
}

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function dirSize(dir) {
  let total = 0;
  let count = 0;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const sub = await dirSize(full);
      total += sub.total; count += sub.count;
    } else {
      total += (await stat(full)).size; count++;
    }
  }
  return { total, count };
}

/** Sammelt aus allen HTML-Dateien in dist/ die Verweise auf eigene Dateien. */
async function pruefeVerweise() {
  const htmlDateien = (await readdir(DIST)).filter((n) => n.endsWith('.html'));
  const fehlend = [];

  for (const datei of htmlDateien) {
    const inhalt = await readFile(path.join(DIST, datei), 'utf8');
    const treffer = inhalt.matchAll(/(?:src|href|srcset|data-map-src)="([^"]+)"/g);
    const ziele = new Set();

    for (const m of treffer) {
      // srcset kann mehrere durch Komma getrennte Eintraege enthalten
      for (const teil of m[1].split(',')) {
        const url = teil.trim().split(/\s+/)[0];
        if (!url) continue;
        if (/^(https?:|data:|mailto:|tel:|#|\/\/)/i.test(url)) continue;
        ziele.add(url.replace(/^\//, '').split(/[?#]/)[0]);
      }
    }

    for (const ziel of ziele) {
      // Saubere URLs (/shop) werden per _redirects auf .html abgebildet
      if (!path.extname(ziel)) continue;
      if (!(await exists(path.join(DIST, ziel)))) fehlend.push({ datei, ziel });
    }
  }
  return fehlend;
}

async function main() {
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  const kopiert = [];
  const fehlend = [];

  for (const entry of PUBLIC_ENTRIES) {
    const src = path.join(ROOT, entry);
    if (!(await exists(src))) { fehlend.push(entry); continue; }
    await cp(src, path.join(DIST, entry), {
      recursive: true,
      // Original-Fotos aus assets/images/ herausfiltern (siehe oben).
      filter: (quelle) => {
        const rel = path.relative(ROOT, quelle).split(path.sep).join('/');
        if (!rel.startsWith('assets/images/')) return true;
        const name = path.basename(quelle);
        if (!path.extname(name)) return true; // Unterordner immer mitnehmen
        return bildWirdVeroeffentlicht(name);
      }
    });
    kopiert.push(entry);
  }

  console.log('Veroeffentlicht werden:');
  kopiert.forEach((e) => console.log('  + ' + e));

  if (fehlend.length) {
    console.error('\nFEHLER: Diese Eintraege fehlen im Projekt:');
    fehlend.forEach((e) => console.error('  ! ' + e));
    process.exitCode = 1;
    return;
  }

  // Sicherheitsnetz: Jede in den HTML-Dateien referenzierte lokale Datei muss
  // auch wirklich in dist/ liegen. Ohne diese Pruefung faellt ein zu strenger
  // Filter (oder eine geloeschte Datei) erst im Netz auf - als fehlendes Bild.
  const fehlendeVerweise = await pruefeVerweise();
  if (fehlendeVerweise.length) {
    console.error('\nFEHLER: Diese referenzierten Dateien fehlen in dist/:');
    fehlendeVerweise.forEach((v) => console.error(`  ! ${v.datei} verweist auf ${v.ziel}`));
    process.exitCode = 1;
    return;
  }
  console.log('\nVerweis-Pruefung: alle referenzierten Dateien sind vorhanden.');

  const { total, count } = await dirSize(DIST);
  console.log(`Fertig: ${count} Datei(en), ${(total / 1024 / 1024).toFixed(1)} MB in dist/`);
  console.log('Nicht veroeffentlicht (bleibt privat): docs/, scripts/, cms/, original-site/, TODO.md, package.json, .github/');
  console.log('Nicht veroeffentlicht: unbearbeitete Original-Fotos (nur Quelle fuer optimize-images).');
}

main().catch((err) => {
  console.error('Fehler beim Zusammenstellen von dist/:', err);
  process.exitCode = 1;
});
