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

## Phase 3 — Übernahme alter Inhalte & Gästebuch ✅ abgeschlossen
- [x] Alle Original-Texte wortgleich übernommen (About, Leistungen, Modals, Info) — per `diff` gegen `original-site/index.html` geprüft, keine Abweichungen
- [x] `content/kundenstimmen.json` mit allen 9 Testimonials (`assets/js/testimonials.js` rendert + Slider-Logik: 1/3 Karten pro Seite, Touch-Swipe, Dots) + Transparenzhinweis im HTML beibehalten
- [x] `docs/redirects.md`: Anker-Kompatibilität geprüft (alle Original-Anker unverändert vorhanden) — keine 301-Redirects nötig, da sich Domain/URL-Struktur/Anker nicht ändern; Domain-Umzug selbst folgt erst in Phase 10

## Phase 4 — Intelligentes Kontaktformular ✅ abgeschlossen
- [x] Dynamische Felder je nach „Anliegen" (wie Original), inkl. Vorbelegung über Leistungs-Karten/Modals
- [x] Formspree vs. natives Hosting-Formular-Feature — **Netlify Forms gewählt**, Begründung in `docs/phase4-kontaktformular.md` (kein zusätzlicher externer Auftragsverarbeiter, im Hosting enthalten)
- [x] Spam-Schutz ohne Cookies: Honeypot-Feld (`bot-field`) + Zeitfalle (<3s), kein reCAPTCHA
- [x] Client-seitige Validierung mit Feld-Fehlermeldungen + Fokus-Sprung; AJAX-Versand, Erfolg/Fehler ohne Reload (`role=status aria-live=polite`); serverseitige Grenzen dokumentiert (keine Netlify Function für Inhalts-Validierung)
- [x] DSGVO-Einwilligungs-Checkbox mit Link zum Datenschutz-Modal, keine zusätzlichen Felder gegenüber dem Original
- [ ] **Hinweis für Phase 7:** Datenschutzerklärung muss Netlify (nicht Formspree) als Formular-Verarbeiter nennen

## Phase 5 — Newsletter & Kundendaten ✅ abgeschlossen
- [x] Brevo-Newsletter mit Double-Opt-in (wie Original, gleiche echte Formular-Action-URL aus dem Original weiterverwendet)
- [x] Optionale Felder Vorname (`PRENOM`) und Interesse (`INTERESSE`: Süßwasser/Meerwasser/Aquariumbau) als Brevo-Kontaktattribute ergänzt
- [x] `docs/anleitung-newsletter.md` für Inhaber (Attribute einrichten, Kampagnen, Segmentierung, Abmeldung), inkl. Screenshot-Platzhaltern
- [x] Keine Tracking-Cookies ohne Consent-Banner; cookiefreies Plausible Analytics als Option dokumentiert (nur auf Wunsch, nicht implementiert)

## Phase 6 — Sicherheit ✅ abgeschlossen
- [x] Security-Header via `netlify.toml`: strenge CSP (nur docs.google.com, sibforms.com, openstreetmap.org, images.unsplash.com erlaubt), X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy (inkl. `interest-cohort=()`), HSTS
- [x] Kein Inline-JS (alles in `assets/js/*.js`); die letzten 4 Inline-`style`-Attribute durch CSS-Klassen ersetzt, damit `style-src`/`script-src` ohne `'unsafe-inline'` auskommen; SRI nicht anwendbar, da keine fremd gehosteten Skripte/Styles (begründet in `docs/phase6-sicherheit.md`)
- [x] OSM-Karte per Zwei-Klick-Lösung (`assets/js/map-loader.js`) — lädt erst nach Klick auf „Karte laden"
- [x] E-Mail-Obfuskations-Utility bereitgestellt (`assets/js/obfuscate-email.js`), einsatzbereit für Phase 7

## Phase 7 — Rechtssicherheit (Deutschland) ✅ abgeschlossen (⚠️ juristische Prüfung ausstehend, siehe unten)
- [x] Impressum (§5 DDG) & Datenschutz vom Original übernommen und an neue Technik angepasst: Formspree→Netlify Forms, Netlify als Hosting/Server-Logs explizit genannt, neuer Absatz zur OSM-Zwei-Klick-Karte ergänzt (im Original noch gar nicht erwähnt gewesen), Brevo/Google-Sheets-Absätze unverändert übernommen
- [x] Als eigene Unterseiten `impressum.html`/`datenschutz.html` (Netlify liefert diese automatisch auch unter `/impressum`/`/datenschutz` aus) UND weiterhin als Modal (footer, Kontaktformular-Einwilligung, Newsletter-Hinweis verlinken alle dorthin)
- [x] `docs/bildquellen.md`: Nachweis aller aktuell verwendeten Bild-/Video-Dateien inkl. Lizenzstatus und offener Punkte
- [x] Alle verbliebenen Inline-Styles entfernt (auch in den neuen Unterseiten), damit die strikte CSP aus Phase 6 überall gilt
- [ ] **Hinweis an den Nutzer (siehe Chat): Rechtstexte vor Livegang von einem Anwalt oder einem Generator wie eRecht24 gegenprüfen lassen — ich bin kein Anwalt.**

## Phase 8 — Performance & Bilder ✅ abgeschlossen (Performance-Endmessung erst auf echtem Hosting, Phase 10)
- [x] AVIF+WebP+JPEG-Fallback (`<picture>`) für alle Foto-Bilder, responsive `srcset`/`sizes` für Hero-Poster & About-Bild, feste `width`/`height` überall, `loading="lazy"` unterhalb des Folds, `fetchpriority="high"` für Hero-Poster
- [x] `scripts/optimize-images.mjs` (sharp) geschrieben **und ausgeführt** — erzeugt AVIF/WebP/JPEG in 480/960/1600px für alle echten Fotos
- [x] Selbst gehostete Fonts (kein Google-Fonts-CDN), `font-display: swap` (bereits seit Phase 1)
- [x] CSS minifiziert (`style.min.css`) + kritisches CSS für Nav/Hero inline; JS minifiziert (`scripts/minify-js.mjs`, Terser) und `defer`
- [x] `docs/lighthouse.md` mit Iterationsverlauf: **Accessibility 100, Best Practices 100, SEO 100** (lokal verifiziert); Performance lokal 61 wegen einfachem Test-Server ohne Parallelität/Caching — echte Messung folgt in Phase 10 auf Netlify
- [x] Echter Bug gefunden & behoben: asynchrones CSS-Nachladen (preload+swap) funktionierte nicht zuverlässig und ließ alle Bereiche unterhalb des Hero ungestyled — zurück zu normalem, blockierendem Stylesheet-Link (Details in `docs/lighthouse.md`)
- [x] Eigene Fotos vom Inhaber eingebunden (About-Bild, 4 Galerie-Bilder, 1 Ladenbild) — **kein Stockfoto mehr auf der Seite**
- [x] Logo neu gestaltet (`assets/logo-mark.svg`, ersetzt Emoji-Platzhalter aus Phase 1 und altes Logo)

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
