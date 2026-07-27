#!/usr/bin/env node
/*
  Holt die im Google Sheet verlinkten Google-Drive-Fotos, optimiert sie
  (AVIF/WebP/JPEG in mehreren Breiten) und legt sie als eigene Kopie im
  Repository ab. Die Website nutzt danach bevorzugt diese schnelle Kopie
  und faellt nur fuer noch nicht gesyncte Bilder uebergangsweise auf den
  Drive-Link zurueck (siehe assets/js/highlights.js).

  Verwendung:
    node scripts/sync-sheet-images.mjs          (normaler Lauf)
    node scripts/sync-sheet-images.mjs --dry-run (nur anzeigen, nichts aendern)

  Laeuft automatisch per GitHub Action (.github/workflows/sync-bilder.yml).
  Was die Ausgabe bedeutet, erklaert docs/sync-log-erklaerung.md.

  Fuer den Inhaber aendert sich nichts: Foto weiterhin in Drive hochladen,
  Link ins Sheet -- der Rest passiert unsichtbar im Hintergrund.
*/
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir, unlink, mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  REPO_ROOT, fetchSheetCsv, parseCSV, rowsToObjects, extractDriveFileId, getSheetUrl
} from './lib/sheet.mjs';

const IMG_DIR = path.join(REPO_ROOT, 'assets', 'images', 'angebote');
const MANIFEST_PATH = path.join(REPO_ROOT, 'content', 'angebote-bilder.json');

// Produktkarten werden nie sehr gross dargestellt -> zwei Breiten genuegen.
const WIDTHS = [480, 960];
const QUALITY = { avif: 50, webp: 75, jpg: 82 };
// Quelle in guter Aufloesung anfordern; heruntergerechnet wird lokal.
const SOURCE_URL = (id) => `https://lh3.googleusercontent.com/d/${id}=w1600`;

const DRY_RUN = process.argv.includes('--dry-run');

function log(msg) { console.log(msg); }

async function loadManifest() {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf8');
    const data = JSON.parse(raw);
    return data && typeof data.bilder === 'object' ? data.bilder : {};
  } catch {
    return {};
  }
}

async function fileExists(p) {
  try { await readFile(p); return true; } catch { return false; }
}

/** Alle im Sheet vorkommenden Drive-Datei-IDs (auch aus "Aktiv = nein"-Zeilen). */
function collectFileIds(items) {
  const found = new Map(); // fileId -> Name (fuer verstaendliche Logs)
  for (const item of items) {
    const raw = item['Bild-Dateiname'] || '';
    if (!/^https?:\/\//i.test(raw.trim())) continue; // lokaler Dateiname, nicht unsere Aufgabe
    if (!/drive\.google\.com|googleusercontent\.com/i.test(raw)) continue;
    const id = extractDriveFileId(raw);
    if (!id) continue;
    if (!found.has(id)) found.set(id, item['Name'] || '(ohne Namen)');
  }
  return found;
}

async function downloadOriginal(fileId) {
  const res = await fetch(SOURCE_URL(fileId));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error('leere Antwort');
  return buf;
}

async function optimize(fileId, buf) {
  const image = sharp(buf).rotate(); // EXIF-Drehung anwenden, Metadaten verwerfen
  const meta = await image.metadata();
  const originalWidth = meta.width || 960;

  let widths = WIDTHS.filter((w) => w <= originalWidth);
  if (!widths.length) widths = [originalWidth];

  for (const width of widths) {
    const resized = image.clone().resize({ width, withoutEnlargement: true });
    await resized.clone().avif({ quality: QUALITY.avif }).toFile(path.join(IMG_DIR, `${fileId}-${width}.avif`));
    await resized.clone().webp({ quality: QUALITY.webp }).toFile(path.join(IMG_DIR, `${fileId}-${width}.webp`));
    await resized.clone().jpeg({ quality: QUALITY.jpg, mozjpeg: true }).toFile(path.join(IMG_DIR, `${fileId}-${width}.jpg`));
  }
  return widths;
}

async function removeFilesFor(fileId) {
  let removed = 0;
  let entries = [];
  try { entries = await readdir(IMG_DIR); } catch { return 0; }
  for (const name of entries) {
    if (name.startsWith(`${fileId}-`)) {
      if (!DRY_RUN) await unlink(path.join(IMG_DIR, name));
      removed++;
    }
  }
  return removed;
}

async function main() {
  log('=== Bilder-Sync: Google Sheet -> optimierte Kopie im Repository ===');
  if (DRY_RUN) log('(Probelauf - es wird nichts geaendert)\n');
  log(`Sheet: ${getSheetUrl()}\n`);

  // 1. Sheet lesen. Schlaegt das fehl, brechen wir ab OHNE aufzuraeumen -
  //    sonst wuerde eine kurze Netzwerkstoerung alle Bilder loeschen.
  let items;
  try {
    const csv = await fetchSheetCsv();
    items = rowsToObjects(parseCSV(csv)).items;
  } catch (err) {
    console.error(`ABBRUCH: Sheet konnte nicht geladen werden (${err.message}).`);
    console.error('Es wurde nichts geaendert. Beim naechsten Lauf wird es erneut versucht.');
    process.exitCode = 1;
    return;
  }

  const wanted = collectFileIds(items);
  log(`Im Sheet gefunden: ${items.length} Zeile(n), davon ${wanted.size} mit Drive-Foto.\n`);

  await mkdir(IMG_DIR, { recursive: true });
  const manifest = await loadManifest();
  const next = {};

  let neu = 0, geaendert = 0, unveraendert = 0, fehlgeschlagen = 0;

  // 2. Jedes Foto pruefen/holen
  for (const [fileId, name] of wanted) {
    const known = manifest[fileId];
    let buf;
    try {
      buf = await downloadOriginal(fileId);
    } catch (err) {
      fehlgeschlagen++;
      if (known) {
        // Bereits vorhandene Kopie behalten - lieber ein aelteres Bild als keins.
        next[fileId] = known;
        log(`  ! "${name}": Download fehlgeschlagen (${err.message}). Bisherige Kopie bleibt erhalten.`);
      } else {
        log(`  ! "${name}": Download fehlgeschlagen (${err.message}). Website zeigt weiter den Drive-Link.`);
      }
      continue;
    }

    const hash = createHash('sha256').update(buf).digest('hex').slice(0, 16);

    if (known && known.hash === hash) {
      // Inhaltlich unveraendert - nur pruefen, ob die Dateien wirklich da sind.
      const complete = (await Promise.all(
        (known.breiten || []).map((w) => fileExists(path.join(IMG_DIR, `${fileId}-${w}.avif`)))
      )).every(Boolean);
      if (complete) {
        next[fileId] = known;
        unveraendert++;
        continue;
      }
      log(`  ~ "${name}": Dateien fehlten, werden neu erzeugt.`);
    }

    if (DRY_RUN) {
      log(`  + "${name}": wuerde ${known ? 'aktualisiert' : 'neu angelegt'} werden.`);
      next[fileId] = known || { hash, breiten: WIDTHS };
      known ? geaendert++ : neu++;
      continue;
    }

    try {
      const breiten = await optimize(fileId, buf);
      next[fileId] = { hash, breiten, aktualisiert: new Date().toISOString() };
      if (known) { geaendert++; log(`  ~ "${name}": Foto wurde in Drive geaendert -> neu optimiert (${breiten.join(', ')} px).`); }
      else { neu++; log(`  + "${name}": neu heruntergeladen und optimiert (${breiten.join(', ')} px).`); }
    } catch (err) {
      fehlgeschlagen++;
      if (known) next[fileId] = known;
      log(`  ! "${name}": Optimierung fehlgeschlagen (${err.message}).`);
    }
  }

  // 3. Aufraeumen: Bilder, deren Zeile im Sheet geloescht oder deren Link
  //    ausgetauscht wurde, sind hier nicht mehr in "wanted" enthalten.
  let aufgeraeumt = 0;
  for (const fileId of Object.keys(manifest)) {
    if (wanted.has(fileId)) continue;
    const removed = await removeFilesFor(fileId);
    if (removed) {
      aufgeraeumt++;
      log(`  - Nicht mehr im Sheet: ${removed} Datei(en) zu ${fileId} ${DRY_RUN ? 'wuerden geloescht' : 'geloescht'}.`);
    }
  }

  // 4. Verwaiste Dateien ohne Manifest-Eintrag ebenfalls entfernen
  //    (z. B. wenn ein frueherer Lauf mittendrin abgebrochen ist).
  try {
    const entries = await readdir(IMG_DIR);
    const knownPrefixes = new Set(Object.keys(next));
    for (const name of entries) {
      const m = name.match(/^(.+)-(\d+)\.(avif|webp|jpg)$/);
      if (!m) continue;
      if (knownPrefixes.has(m[1])) continue;
      if (!DRY_RUN) await unlink(path.join(IMG_DIR, name));
      log(`  - Verwaiste Datei entfernt: ${name}`);
    }
  } catch { /* Ordner existiert evtl. noch nicht */ }

  // 5. Manifest schreiben
  const manifestData = {
    hinweis: 'Automatisch erzeugt von scripts/sync-sheet-images.mjs. Nicht von Hand bearbeiten.',
    generiert: new Date().toISOString(),
    bilder: next
  };
  if (!DRY_RUN) {
    await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
    await writeFile(MANIFEST_PATH, JSON.stringify(manifestData, null, 2) + '\n', 'utf8');
  }

  log('\n--- Zusammenfassung ---');
  log(`  Neu optimiert:            ${neu}`);
  log(`  Aktualisiert:             ${geaendert}`);
  log(`  Unveraendert (nichts zu tun): ${unveraendert}`);
  log(`  Aufgeraeumt (aus Sheet entfernt): ${aufgeraeumt}`);
  log(`  Fehlgeschlagen:           ${fehlgeschlagen}`);
  log(`  Insgesamt verfuegbar:     ${Object.keys(next).length} Foto(s)`);
  if (fehlgeschlagen > 0) {
    log('\nHinweis: Fehlgeschlagene Bilder werden beim naechsten Lauf erneut versucht.');
    log('Die Website zeigt fuer diese uebergangsweise den Drive-Link bzw. das Platzhalterbild -');
    log('es entsteht also nie eine kaputte Karte. Details: docs/sync-log-erklaerung.md');
  }
}

main().catch((err) => {
  console.error('Unerwarteter Fehler beim Bilder-Sync:', err);
  process.exitCode = 1;
});
