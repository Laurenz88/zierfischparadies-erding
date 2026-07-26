// Selbsttest fuer das Angebote-Sheet: laedt das live veroeffentlichte CSV
// (dieselbe URL wie assets/js/highlights.js) und listet alle Probleme in
// verstaendlichem Deutsch auf. Aufruf: npm run check-sheet
//
// Die CSV-Parsing- und Validierungs-Logik ist absichtlich eine eigene Kopie
// (nicht importiert), weil assets/js/highlights.js fuer den Browser gedacht
// ist (IIFE, keine Exports). Aenderungen an der Parsing-/Validierungslogik
// dort bitte hier spiegeln.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const highlightsPath = path.join(__dirname, '..', 'assets', 'js', 'highlights.js');

function getSheetUrl() {
  const src = readFileSync(highlightsPath, 'utf8');
  const m = src.match(/SHEET_CSV_URL\s*=\s*'([^']+)'/);
  if (!m || !m[1]) {
    throw new Error('Konnte SHEET_CSV_URL nicht aus assets/js/highlights.js lesen.');
  }
  return m[1];
}

function parseCSV(text) {
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

const ACTIVE_VALUES = ['ja', 'yes', 'true', '1', 'x'];
const INACTIVE_VALUES = ['nein', 'no', 'false', '0', ''];

function parsePrice(val) {
  if (!val) return null;
  const cleaned = String(val).replace(/[^\d,.-]/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

async function main() {
  const url = getSheetUrl();
  console.log('Lade Live-CSV von:');
  console.log('  ' + url);
  console.log('');

  let text;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    text = await res.text();
  } catch (err) {
    console.error('FEHLER: Sheet konnte nicht geladen werden - ' + err.message);
    console.error('Pruefe die Internetverbindung und ob die Freigabe des Sheets noch aktiv ist.');
    process.exitCode = 1;
    return;
  }

  const rows = parseCSV(text);
  if (!rows.length) {
    console.error('FEHLER: Das Sheet enthaelt keine Daten (leeres CSV).');
    process.exitCode = 1;
    return;
  }

  const headers = rows[0].map((h) => h.trim());
  console.log('Kopfzeile (' + headers.length + ' Spalten): ' + headers.join(' | '));
  console.log('Datenzeilen: ' + (rows.length - 1));
  console.log('');

  const problems = [];
  const notes = [];
  const seenNames = {};
  const seenImages = {};
  let activeCount = 0;

  rows.slice(1).forEach((r, i) => {
    const sheetRow = i + 2; // Zeile 1 = Kopfzeile in Google Sheets
    const item = {};
    headers.forEach((h, j) => { item[h] = (r[j] || '').trim(); });

    if (r.length !== headers.length) {
      problems.push('Zeile ' + sheetRow + ': ' + r.length + ' statt ' + headers.length + ' Spalten erkannt - vermutlich ein Komma oder Anfuehrungszeichen zu viel/zu wenig in einer Zelle.');
    }

    const aktivRaw = item['Aktiv'] || '';
    const aktivNorm = aktivRaw.trim().toLowerCase();
    const isKnownActive = ACTIVE_VALUES.includes(aktivNorm);
    const isKnownInactive = INACTIVE_VALUES.includes(aktivNorm);
    if (!isKnownActive && !isKnownInactive) {
      problems.push('Zeile ' + sheetRow + ': Aktiv ist "' + aktivRaw + '" - muss ja/nein sein. Die Zeile wird auf der Website als "nein" (inaktiv) behandelt.');
    }
    if (!isKnownActive) return; // Rest der Pruefungen nur fuer aktive Zeilen relevant

    activeCount++;

    const kategorieRaw = item['Kategorie'] || '';
    const kategorie = kategorieRaw.trim().toLowerCase();
    if (kategorie !== 'angebot' && kategorie !== 'neu') {
      problems.push('Zeile ' + sheetRow + ': Kategorie ist "' + kategorieRaw + '" - muss "Angebot" oder "Neu" sein. Die Zeile wird auf der Website uebersprungen (erscheint nirgends).');
      return;
    }

    const name = item['Name'] || '';
    const nameKey = name.toLowerCase();
    if (!name) {
      problems.push('Zeile ' + sheetRow + ': Name fehlt.');
    } else if (seenNames[nameKey]) {
      problems.push('Zeile ' + sheetRow + ': Name "' + name + '" ist doppelt mit Zeile ' + seenNames[nameKey] + ' - nur die erste Zeile wird angezeigt.');
    } else {
      seenNames[nameKey] = sheetRow;
    }

    const img = item['Bild-Dateiname'] || '';
    const imgKey = img.toLowerCase();
    if (img && seenImages[imgKey]) {
      problems.push('Zeile ' + sheetRow + ' ("' + (name || '?') + '"): Bild-Link ist doppelt mit Zeile ' + seenImages[imgKey] + ' - nur die erste Zeile wird angezeigt.');
    } else if (img) {
      seenImages[imgKey] = sheetRow;
    } else {
      notes.push('Zeile ' + sheetRow + ' ("' + (name || '?') + '"): kein Bild angegeben - es wird ein Platzhalterbild angezeigt.');
    }

    const preis = parsePrice(item['Preis']);
    const streichpreis = parsePrice(item['Streichpreis']);
    if (preis != null && streichpreis != null && preis >= streichpreis) {
      problems.push('Zeile ' + sheetRow + ' ("' + (name || '?') + '"): Preis (' + item['Preis'] + ') ist nicht kleiner als Streichpreis (' + item['Streichpreis'] + ') - beim Streichpreis sollte der hoehere, alte Preis stehen.');
    }
  });

  console.log('Aktive Zeilen (werden auf der Website angezeigt, sofern gueltig): ' + activeCount);
  console.log('');

  if (notes.length) {
    console.log('Hinweise (kein Fehler, nur zur Info):');
    notes.forEach((n) => console.log('  - ' + n));
    console.log('');
  }

  if (problems.length) {
    console.log('GEFUNDENE PROBLEME (' + problems.length + '):');
    problems.forEach((p) => console.log('  - ' + p));
    console.log('');
    console.log('Bitte die betroffenen Zeilen im Sheet korrigieren.');
    process.exitCode = 1;
  } else {
    console.log('Keine Probleme gefunden. Das Sheet ist sauber.');
  }
}

main();
