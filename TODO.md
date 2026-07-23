# TODO — Zierfischparadies Erding Relaunch

Ziel: 1:1-Nachbau (inhaltlich/strukturell) von https://zierfischparadies-erding.de als moderne, statische Website. Lighthouse 100/100/100/100.

## Phase 0 — Analyse des Originals ✅ abgeschlossen
- [x] Live-Seite heruntergeladen (HTML) → `original-site/index.html` (Referenz, nicht Teil der neuen Seite)
- [x] Struktur, Farbschema, Schriften, Animationen, eingebundene Dienste dokumentiert → `docs/analyse.md`
- [x] Abgleich mit vorgegebener Sektionsliste — passt überein
- [x] Unsplash-Bilder-Inventar erstellt (Ersatz durch eigene Fotos, `TODO-EIGENES-FOTO`)
- [x] Urheberrechts-Hinweis zu „Andreas Fuchs" (Footer-Credit) an Nutzer kommuniziert — **Klärung durch Nutzer ausstehend**
- [x] Git-Repo initialisiert

## Phase 1 — Technisches Fundament ✅ abgeschlossen
- [x] Stack-Entscheidung (reines HTML/CSS/JS, kein Astro) mit Begründung dokumentiert → `docs/phase1-fundament.md`
- [x] Projektstruktur angelegt (`index.html`, `assets/css|js|fonts|images|video`, `docs`, `cms`, `content`, `scripts`)
- [x] Semantisches HTML5-Grundgerüst (ein H1, saubere Heading-Hierarchie, ARIA, Skip-Link, Fokus-Falle in Modals, Tastaturbedienbarkeit, `prefers-reduced-motion`)
- [x] Responsive Mobile-First-Grundlage (360/768/1280px Breakpoints), per Headless-Chrome-Screenshot verifiziert
- [x] Hero-Video: Quelldatei gesichert, komprimiert auf MP4 (5,65 MB) + WebM (6,17 MB), Poster-Bild (136 KB), `preload="metadata"`, Video wird per JS nur ab 769px und ohne `prefers-reduced-motion` nachgeladen (mobil nur Poster)
- [x] Reale Assets vom Original gesichert (Fonts, Video, ref-/laden-Bilder, og.jpg) als Rohmaterial
- [x] Lokaler Test: 2 echte Bugs gefunden & behoben (hero-video.js löschte auf Mobile versehentlich das Poster-Bild; Video wurde auf Desktop nie injiziert, da derselbe fehlerhafte Selektor auch dort das Frühzeitig-Abbrechen auslöste)

## Phase 2 — CMS für Angebote (Google Sheets/CSV) ✅ abgeschlossen (Code fertig, wartet auf echtes Sheet)
- [x] CSV-Anbindung implementiert (`assets/js/highlights.js`, eigener RFC4180-Mini-Parser, keine Abhängigkeit) — Spalten: Kategorie, Name, Lateinischer Name, Größe, Info, Preis, Streichpreis, Rabatt-%, Bild-Dateiname, Aktiv
- [x] `cms/angebote-vorlage.csv` (Vorlage mit Beispieldaten)
- [x] `docs/anleitung-angebote.md` (Laien-Anleitung mit Screenshot-Platzhaltern, inkl. einmaliger Einrichtung)
- [x] Fallback-Hinweis „Aktuelle Angebote im Laden erfragen" bei Ladefehler, leerem Ergebnis oder noch nicht konfiguriertem Sheet
- [x] Pflichthinweis Streichpreis/Omnibus-Richtlinie (PAngV) unter den Karten beibehalten
- [ ] **Wartet auf Nutzer:** echte, veröffentlichte Google-Sheet-CSV-URL in `assets/js/highlights.js` (`SHEET_CSV_URL`) eintragen, sobald das Sheet angelegt ist

## Phase 3 — Übernahme alter Inhalte & Gästebuch
- [ ] Alle Original-Texte wortgleich übernehmen (About, Leistungen, Modals, Info)
- [ ] `content/kundenstimmen.json` mit allen 9 Testimonials + Transparenzhinweis
- [ ] `docs/redirects.md` + Hosting-Redirect-Konfiguration (301) für alte Anker/URLs

## Phase 4 — Intelligentes Kontaktformular
- [ ] Dynamische Felder je nach „Anliegen" (wie Original)
- [ ] Formspree vs. natives Hosting-Formular-Feature — Entscheidung begründen
- [ ] Spam-Schutz ohne Cookies: Honeypot + Zeitfalle (<3s)
- [ ] Client-/serverseitige Validierung, Erfolgsmeldung ohne Reload
- [ ] DSGVO-Einwilligungs-Checkbox + Link Datenschutz, Datenminimierung

## Phase 5 — Newsletter & Kundendaten
- [ ] Brevo-Newsletter mit Double-Opt-in (wie Original)
- [ ] Optionale Felder Vorname/Interesse als Brevo-Kontaktattribute
- [ ] `docs/anleitung-newsletter.md` für Inhaber (Kampagnen, Segmentierung, Abmeldung)
- [ ] Keine Tracking-Cookies ohne Consent-Banner; ggf. cookiefreies Analytics vorschlagen

## Phase 6 — Sicherheit
- [ ] Security-Header (CSP streng, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS) via Hosting-Konfiguration
- [ ] Kein Inline-JS ohne Nonce/Hash, keine unnötigen externen Skripte, SRI wo möglich
- [ ] OSM-Karte per Zwei-Klick-Lösung (Datenschutz + Ladezeit)
- [ ] E-Mail im Impressum vor Harvestern schützen (JS-Obfuskation)

## Phase 7 — Rechtssicherheit (Deutschland)
- [ ] Impressum (§5 DDG) & Datenschutz 1:1 übernehmen, an neue Technik anpassen (alle tatsächlich genutzten Dienste nennen)
- [ ] Als eigene Unterseiten `/impressum`, `/datenschutz` UND als Modal
- [ ] `docs/bildquellen.md` (Bildrechte-Nachweis für alle finalen Bilder)
- [ ] Hinweis an Nutzer: Rechtstexte juristisch prüfen lassen (z. B. eRecht24) — keine Rechtsberatung durch mich

## Phase 8 — Performance & Bilder (Ziel: 100)
- [ ] AVIF+WebP+JPEG-Fallback, responsive srcset/sizes, feste width/height, lazy loading unterhalb des Folds, `fetchpriority="high"` für Hero
- [ ] `scripts/optimize-images.mjs` (sharp) + Anleitung für Inhaber
- [ ] Selbst gehostete Fonts (kein Google-Fonts-CDN), `font-display: swap`
- [ ] CSS minifiziert + kritisches CSS inline, JS minimal & deferred
- [ ] `docs/lighthouse.md` mit iterativen Messergebnissen bis 100/100/100/100 (mobil + Desktop)

## Phase 9 — SEO (Ziel: 100)
- [ ] Meta-Title/-Description, OG + Twitter Cards (eigenes 1200×630-Bild), Canonical
- [ ] JSON-LD LocalBusiness/PetStore inkl. Geo-Koordinaten, sameAs, ggf. FAQPage
- [ ] sitemap.xml, robots.txt, sprechende Anker, beschreibende Alt-Texte mit Fischnamen
- [ ] Lokales SEO Keyword-Fokus („Zierfische Erding" etc.) + Hinweis: Google-Unternehmensprofil einrichten/pflegen

## Phase 10 — Launch: Domain-Umzug & Search Console (⛔ NUR nach expliziter Freigabe des Nutzers)
- [ ] `docs/launch-checkliste.md`: Deployment + Vorschau-Test (alle Formulare live), DNS-Umstellung (TTL vorher senken) + HTTPS-Check, 301-Redirects aktivieren, Google Search Console (Property, Verifizierung — alter Verification-Tag `JEor7cRkWugFqFn…` prüfen, Sitemap einreichen), Bing Webmaster Tools, Nachkontrolle Indexierung/Core Web Vitals/Rankings nach 1–2 Wochen

## Qualitätssicherung (laufend, nach jeder Phase)
- [ ] Screenshot-Vergleich neu vs. alt
- [ ] Lighthouse-Check
- [ ] HTML-Validierung (W3C)
- [ ] Link-Check
- [ ] Browsertest Chrome/Firefox/Safari(iOS) — Zielgruppe eher älter & mobil: große Schrift, große Touch-Ziele, Telefonnummer überall antippbar

## Harte Einschränkungen (NICHT tun)
- Keine Cookies/Tracker ohne Rücksprache. Kein jQuery, kein Bootstrap, keine unnötigen Abhängigkeiten.
- Keine Fantasie-Inhalte erfinden — bei fehlenden Infos (echte Fotos, Zugangsdaten etc.) nachfragen statt annehmen.
- Phase 10 (Domain-Umzug etc.) niemals ohne explizite Freigabe des Nutzers ausführen.

## Offene Klärungen an den Nutzer
- [ ] Urheberrecht Design/Code (Andreas Fuchs) — siehe `docs/analyse.md` Abschnitt 7
- [ ] Reale Fotos/Video vom Inhaber erhalten (aktuell nur Original-Server-Assets + Unsplash-Platzhalter)
- [ ] Hosting-Ziel final bestätigen (Vorschlag: Netlify, Begründung in Phase 1)
- [ ] Formspree vs. natives Hosting-Formular (Phase 4) final bestätigen
- [ ] Zugang/Berechtigung für Google Search Console Property klären (Phase 10, erst später relevant)
