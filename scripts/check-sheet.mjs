// Selbsttest fuer das Angebote-Sheet: laedt das live veroeffentlichte CSV
// (dieselbe URL wie assets/js/highlights.js) und listet alle Probleme in
// verstaendlichem Deutsch auf. Aufruf: npm run check-sheet
//
// CSV-Parsing und Sheet-Zugriff liegen in scripts/lib/sheet.mjs, damit sich
// dieses Skript und scripts/sync-sheet-images.mjs dieselbe Logik teilen.

import { getSheetUrl, fetchSheetCsv, parseCSV, ACTIVE_VALUES, INACTIVE_VALUES } from './lib/sheet.mjs';

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
    text = await fetchSheetCsv(url);
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
