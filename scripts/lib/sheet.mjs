/*
  Gemeinsame Helfer fuer alle Skripte, die das Angebote-Google-Sheet lesen
  (scripts/check-sheet.mjs, scripts/sync-sheet-images.mjs).

  Die Parsing-Logik hier muss zur Browser-Variante in assets/js/highlights.js
  passen. Diese Datei ist ESM fuer Node; highlights.js ist bewusst eine
  eigenstaendige IIFE fuer den Browser (kein Build-Schritt fuer die Website),
  weshalb es dort eine funktionsgleiche Kopie gibt. Aenderungen an parseCSV()
  oder extractDriveFileId() bitte in beiden Dateien nachziehen.
*/
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, '..', '..');
const HIGHLIGHTS_JS = path.join(REPO_ROOT, 'assets', 'js', 'highlights.js');

/** Liest die CSV-URL aus highlights.js, damit es nur eine Quelle der Wahrheit gibt. */
export function getSheetUrl() {
  const src = readFileSync(HIGHLIGHTS_JS, 'utf8');
  const m = src.match(/SHEET_CSV_URL\s*=\s*'([^']+)'/);
  if (!m || !m[1]) {
    throw new Error('Konnte SHEET_CSV_URL nicht aus assets/js/highlights.js lesen.');
  }
  return m[1];
}

/** RFC4180-Parser: beachtet Anfuehrungszeichen, Kommas und Zeilenumbrueche in Zellen. */
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

/** Wandelt die geparsten Zeilen in Objekte um (Spaltenname -> Wert). */
export function rowsToObjects(rows) {
  if (!rows.length) return { headers: [], items: [] };
  const headers = rows[0].map((h) => h.trim());
  const items = rows.slice(1).map((r, i) => {
    const item = { __sheetRow: i + 2 }; // Zeile 1 ist die Kopfzeile
    headers.forEach((h, j) => { item[h] = (r[j] || '').trim(); });
    return item;
  });
  return { headers, items };
}

export const ACTIVE_VALUES = ['ja', 'yes', 'true', '1', 'x'];
export const INACTIVE_VALUES = ['nein', 'no', 'false', '0', ''];

export function isActive(val) {
  return ACTIVE_VALUES.includes(String(val || '').trim().toLowerCase());
}

/** Erkennt die Datei-ID in einem Google-Drive-Link (oder null). */
export function extractDriveFileId(url) {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]{10,})/,
    /[?&]id=([a-zA-Z0-9_-]{10,})/,
    /googleusercontent\.com\/d\/([a-zA-Z0-9_-]{10,})/
  ];
  for (const p of patterns) {
    const m = String(url || '').match(p);
    if (m) return m[1];
  }
  return null;
}

/** Laedt das Live-CSV des Sheets. */
export async function fetchSheetCsv(url = getSheetUrl()) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.text();
}
