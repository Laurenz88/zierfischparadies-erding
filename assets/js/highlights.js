/*
  Laedt "Angebote der Woche" / "Frische Neuzugaenge" aus einem oeffentlich
  als CSV veroeffentlichten Google Sheet (Datei > Freigeben > Im Web
  veroeffentlichen > CSV). Vorlage & Anleitung: cms/angebote-vorlage.csv
  und docs/anleitung-angebote.md.

  Erwartete Spalten (Reihenfolge in der Kopfzeile ist egal, Namen muessen
  aber exakt so heissen):
  Kategorie | Name | Lateinischer Name | Größe | Info | Preis |
  Streichpreis | Rabatt-% | Bild-Dateiname | Aktiv

  "Bild-Dateiname" akzeptiert drei Formate (siehe resolveImageSrc()):
  1. Lokaler Dateiname (liegt in assets/images/angebote/), z.B. "diskus.jpg"
  2. Eine normale externe Bild-URL (http/https)
  3. Ein Google-Drive-Freigabelink (App "Link kopieren" oder Browser),
     wird automatisch in ein direkt anzeigbares Bildformat umgewandelt.
  Laedt ein Bild nicht (kaputter Link, keine Freigabe, o.ae.), greift der
  onerror-Fallback im <img> automatisch auf ein Platzhalterbild zurueck.
*/
(function () {
  // "Im Web veroeffentlichen"-CSV-URL des Angebote-Sheets (siehe docs/anleitung-angebote.md).
  var SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR1aVB2-hBz375Tgf_OI9dXyZEa190xqLGl4GTJYv5bDHeH8H_VtJ6ATrXF3Sq3yDcbv-v9yVT-LhQL/pub?gid=1048116277&single=true&output=csv';

  var IMG_BASE = 'assets/images/angebote/';
  var PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='450'%3E%3Crect width='600' height='450' fill='%230f3437'/%3E%3Ctext x='50%25' y='48%25' dominant-baseline='middle' text-anchor='middle' fill='%23d9a86c' font-family='sans-serif' font-size='52'%3E%F0%9F%90%9F%3C/text%3E%3Ctext x='50%25' y='68%25' dominant-baseline='middle' text-anchor='middle' fill='rgba(238,245,242,0.4)' font-family='sans-serif' font-size='15'%3EKein Bild verf%C3%BCgbar%3C/text%3E%3C/svg%3E";

  function esc(val) {
    return String(val == null ? '' : val)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function has(val) {
    return val != null && String(val).trim() !== '';
  }

  // Minimaler RFC4180-CSV-Parser: unterstuetzt in Anfuehrungszeichen
  // gesetzte Felder mit Kommas, Zeilenumbruechen und doppelten Anfuehrungszeichen
  // (z. B. Preise wie "29,90€", die wegen des Kommas von Google automatisch
  // in Anfuehrungszeichen exportiert werden). Ein evtl. fuehrender
  // Byte-Order-Mark (manche CSV-Exporte fuegen ihn vor der ersten Spalte
  // ein) wird entfernt, da er sonst den Namen der ersten Spalte
  // ("Kategorie") unbemerkt verfaelschen wuerde.
  function parseCSV(text) {
    var rows = [];
    var row = [];
    var field = '';
    var inQuotes = false;
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (var i = 0; i < text.length; i++) {
      var c = text[i];
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
    return rows.filter(function (r) { return r.some(function (c) { return c.trim() !== ''; }); });
  }

  function isActive(val) {
    var v = String(val || '').trim().toLowerCase();
    return v === 'ja' || v === 'yes' || v === 'true' || v === '1' || v === 'x';
  }

  function normalizeCategory(val) {
    return String(val || '').trim().toLowerCase();
  }

  // Erkennt eine Google-Drive-URL (Freigabelink aus App oder Browser,
  // "Link kopieren", offene "?id="-Links oder bereits umgewandelte
  // googleusercontent.com-Links) und liefert die enthaltene Datei-ID,
  // oder null, wenn keine gefunden wird.
  function extractDriveFileId(url) {
    var patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]{10,})/,
      /[?&]id=([a-zA-Z0-9_-]{10,})/,
      /googleusercontent\.com\/d\/([a-zA-Z0-9_-]{10,})/
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = url.match(patterns[i]);
      if (m) return m[1];
    }
    return null;
  }

  // Spalte "Bild-Dateiname" akzeptiert drei Formate: lokaler Dateiname
  // (assets/images/angebote/...), eine normale externe Bild-URL, oder
  // ein Google-Drive-Freigabelink (wird automatisch in ein direkt
  // anzeigbares Format umgewandelt). Kann keine gueltige Bildquelle
  // ermittelt werden, wird sofort der Platzhalter verwendet, statt
  // einen von vornherein aussichtslosen Ladeversuch zu starten.
  function resolveImageSrc(value) {
    if (!has(value)) return PLACEHOLDER;
    var v = value.trim();
    if (/^https?:\/\//i.test(v)) {
      if (/drive\.google\.com|googleusercontent\.com/i.test(v)) {
        var fileId = extractDriveFileId(v);
        return fileId ? 'https://lh3.googleusercontent.com/d/' + fileId + '=w800' : PLACEHOLDER;
      }
      return v;
    }
    return IMG_BASE + encodeURIComponent(v);
  }

  // Baut aus den geparsten CSV-Zeilen die Angebote-/Neuzugaenge-Listen.
  // Ueberspringt dabei (mit erklaerender Konsolen-Warnung statt stillem
  // Verschwinden): Zeilen mit Aktiv != ja, Zeilen mit unbekannter
  // Kategorie (nicht "Angebot"/"Neu" - werden NICHT irgendwo einsortiert)
  // sowie Zeilen, deren Name oder Bild-Link bereits bei einer frueheren
  // Zeile vorkam (nur die erste Zeile eines Duplikats wird angezeigt).
  function buildLists(rows) {
    var angebote = [];
    var neuheiten = [];
    if (!rows.length) return { angebote: angebote, neuheiten: neuheiten };

    var headers = rows[0].map(function (h) { return h.trim(); });
    var seenNames = {};
    var seenImages = {};

    rows.slice(1).forEach(function (r, i) {
      var sheetRow = i + 2; // Zeile 1 ist die Kopfzeile in Google Sheets
      if (r.length !== headers.length) {
        console.warn('[Highlights] Zeile ' + sheetRow + ': ' + r.length + ' statt ' + headers.length + ' Spalten erkannt - Zeile wird trotzdem so gut wie moeglich verarbeitet, bitte im Sheet pruefen (evtl. ein Komma oder Anfuehrungszeichen zu viel/zu wenig).');
      }
      var item = {};
      headers.forEach(function (h, j) { item[h] = (r[j] || '').trim(); });

      if (!isActive(item['Aktiv'])) return;

      var kategorie = normalizeCategory(item['Kategorie']);
      var isAngebot = kategorie === 'angebot';
      var isNeu = kategorie === 'neu';
      if (!isAngebot && !isNeu) {
        console.warn('[Highlights] Zeile ' + sheetRow + ' uebersprungen: unbekannte Kategorie "' + item['Kategorie'] + '" (erwartet: "Angebot" oder "Neu").');
        return;
      }

      var name = item['Name'] || '';
      var nameKey = name.toLowerCase();
      if (nameKey && seenNames[nameKey]) {
        console.warn('[Highlights] Zeile ' + sheetRow + ' uebersprungen: Name "' + name + '" ist ein Duplikat von Zeile ' + seenNames[nameKey] + '.');
        return;
      }

      var img = item['Bild-Dateiname'] || '';
      var imgKey = img.toLowerCase();
      if (imgKey && seenImages[imgKey]) {
        console.warn('[Highlights] Zeile ' + sheetRow + ' ("' + name + '") uebersprungen: Bild-Link ist ein Duplikat von Zeile ' + seenImages[imgKey] + '.');
        return;
      }

      if (nameKey) seenNames[nameKey] = sheetRow;
      if (imgKey) seenImages[imgKey] = sheetRow;

      if (isAngebot) { angebote.push(item); } else { neuheiten.push(item); }
    });

    return { angebote: angebote, neuheiten: neuheiten };
  }

  function infoLine(item) {
    return [item['Lateinischer Name'], item['Größe'], item['Info']]
      .filter(has)
      .map(esc)
      .join(' · ');
  }

  function card(item, isAngebot) {
    var name = item['Name'];
    var titelHtml = has(name) ? '<div class="product-card-title">' + esc(name) + '</div>' : '';
    var beschr = infoLine(item);
    var beschrHtml = beschr ? '<div class="product-card-info">' + beschr + '</div>' : '';

    var badge = '';
    if (isAngebot && has(item['Rabatt-%'])) {
      badge = '<span class="product-card-corner-badge badge-sale">' + esc(item['Rabatt-%']) + '</span>';
    }

    var pricing = '';
    var alt = has(item['Streichpreis']) ? '<span class="price-old">' + esc(item['Streichpreis']) + '</span>' : '';
    var neuClass = isAngebot ? 'price-new' : 'price-new-gold';
    var neu = has(item['Preis']) ? '<span class="' + neuClass + '">' + esc(item['Preis']) + '</span>' : '';
    if (alt || neu) pricing = '<div class="product-card-pricing">' + alt + neu + '</div>';

    return (
      '<div class="product-card">' +
        '<div class="product-card-img-wrap">' + badge +
          '<img class="product-card-img" src="' + resolveImageSrc(item['Bild-Dateiname']) + '"' +
          ' alt="' + esc(name) + '" loading="lazy"' +
          ' onerror="this.onerror=null;this.src=\'' + PLACEHOLDER.replace(/'/g, '%27') + '\'">' +
        '</div>' +
        '<div class="product-card-body">' + titelHtml + beschrHtml + pricing + '</div>' +
      '</div>'
    );
  }

  function showFallback(el, message) {
    el.innerHTML = '<p class="highlights-status-msg">' + esc(message) + '</p>';
  }

  function render(gridEl, items, isAngebot, emptyMessage) {
    if (!items.length) {
      showFallback(gridEl, emptyMessage);
      return;
    }
    gridEl.innerHTML = items.map(function (item) { return card(item, isAngebot); }).join('');
  }

  async function init() {
    var gridA = document.getElementById('angebote-grid');
    var gridB = document.getElementById('neuheiten-grid');
    if (!gridA || !gridB) return;

    var FALLBACK = 'Aktuelle Angebote im Laden erfragen.';

    if (!SHEET_CSV_URL) {
      // Noch nicht konfiguriert: Platzhaltertext aus dem HTML bleibt stehen.
      return;
    }

    showFallback(gridA, 'Angebote werden geladen …');
    showFallback(gridB, 'Neuzugänge werden geladen …');

    try {
      var res = await fetch(SHEET_CSV_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var text = await res.text();
      var lists = buildLists(parseCSV(text));

      render(gridA, lists.angebote, true, FALLBACK);
      render(gridB, lists.neuheiten, false, FALLBACK);
    } catch (err) {
      console.error('[Highlights] Sheet konnte nicht geladen werden:', err);
      showFallback(gridA, FALLBACK);
      showFallback(gridB, FALLBACK);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
