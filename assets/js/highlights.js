/*
  Laedt "Angebote der Woche" / "Frische Neuzugaenge" aus einem oeffentlich
  als CSV veroeffentlichten Google Sheet (Datei > Freigeben > Im Web
  veroeffentlichen > CSV). Vorlage & Anleitung: cms/angebote-vorlage.csv
  und docs/anleitung-angebote.md.

  Erwartete Spalten (Reihenfolge in der Kopfzeile ist egal, Namen muessen
  aber exakt so heissen):
  Kategorie | Name | Lateinischer Name | Größe | Info | Preis |
  Streichpreis | Rabatt-% | Bild-Dateiname | Aktiv
*/
(function () {
  // TODO: Nach Veroeffentlichung des eigenen Google Sheets hier die
  // "Im Web veroeffentlichen"-CSV-URL eintragen (siehe docs/anleitung-angebote.md).
  var SHEET_CSV_URL = '';

  var IMG_BASE = 'assets/images/angebote/';
  var PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='450'%3E%3Crect width='600' height='450' fill='%230a192f'/%3E%3Ctext x='50%25' y='48%25' dominant-baseline='middle' text-anchor='middle' fill='%23D4AF37' font-family='sans-serif' font-size='52'%3E%F0%9F%90%9F%3C/text%3E%3Ctext x='50%25' y='68%25' dominant-baseline='middle' text-anchor='middle' fill='rgba(255,255,255,0.4)' font-family='sans-serif' font-size='15'%3EKein Bild verf%C3%BCgbar%3C/text%3E%3C/svg%3E";

  function esc(val) {
    return String(val == null ? '' : val)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function has(val) {
    return val != null && String(val).trim() !== '';
  }

  // Minimaler RFC4180-CSV-Parser: unterstuetzt in Anfuehrungszeichen
  // gesetzte Felder mit Kommas, Zeilenumbruechen und doppelten Anfuehrungszeichen.
  function parseCSV(text) {
    var rows = [];
    var row = [];
    var field = '';
    var inQuotes = false;
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

  function rowsToObjects(rows) {
    if (!rows.length) return [];
    var headers = rows[0].map(function (h) { return h.trim(); });
    return rows.slice(1).map(function (r) {
      var obj = {};
      headers.forEach(function (h, i) { obj[h] = (r[i] || '').trim(); });
      return obj;
    });
  }

  function isActive(val) {
    var v = String(val || '').trim().toLowerCase();
    return v === 'ja' || v === 'yes' || v === 'true' || v === '1' || v === 'x';
  }

  function imgSrc(filename) {
    if (!has(filename)) return PLACEHOLDER;
    return IMG_BASE + encodeURIComponent(filename.trim());
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
          '<img class="product-card-img" src="' + imgSrc(item['Bild-Dateiname']) + '"' +
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
      var items = rowsToObjects(parseCSV(text)).filter(function (item) {
        return isActive(item['Aktiv']);
      });

      var angebote = items.filter(function (item) {
        return (item['Kategorie'] || '').trim().toLowerCase() === 'angebot';
      });
      var neuheiten = items.filter(function (item) {
        return (item['Kategorie'] || '').trim().toLowerCase() === 'neu';
      });

      render(gridA, angebote, true, FALLBACK);
      render(gridB, neuheiten, false, FALLBACK);
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
