# TODO — Zierfischparadies Erding Relaunch

Ziel: 1:1-Nachbau (inhaltlich/strukturell) von <https://zierfischparadies-erding.de> als moderne, statische Website. Lighthouse 100/100/100/100.

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

## Phase 9 — SEO ✅ abgeschlossen (lokal SEO/Accessibility/Best-Practices je 100 in Lighthouse)

- [x] Meta-Title/-Description (mit lokalen Keywords), OG + Twitter Cards (eigenes `og.jpg`, bereits 1200×630), Canonical auf allen 3 Seiten
- [x] JSON-LD `PetStore`/LocalBusiness inkl. Geo-Koordinaten, `sameAs` (Facebook); FAQPage bewusst nicht ergänzt (kein echter FAQ-Inhalt auf der Seite, siehe `docs/phase9-seo.md`)
- [x] sitemap.xml/robots.txt vorhanden (inkl. `/impressum`, `/datenschutz`), Anker-Kompatibilität bereits in Phase 3 geprüft, Alt-Texte der neuen Galerie-Fotos beschreibend
- [x] Lokale Keywords natürlich in Title/Description/Content verankert; Empfehlung zum Google-Unternehmensprofil in `docs/phase9-seo.md` dokumentiert

## Phase 10 — Launch: Domain-Umzug & Search Console (⛔ NUR nach expliziter Freigabe des Nutzers)

- [x] `docs/launch-checkliste.md` erstellt (reine Dokumentation, keine Aktionen ausgeführt)
- [ ] **Ausführung der Checkliste selbst wartet auf explizite Freigabe** — inkl. Klärung: Zugriff auf altes Google-Search-Console-Konto (Verifizierungs-Tag `JEor7cRkWugFqFn…` aus dem Original wurde nicht übernommen, siehe Checkliste Punkt 4)

## Phase 11 — Launch-Vorbereitung & Go-Live (laufend)

- [x] **1. Restfehler-Sweep:** `html-validate` gegen alle 4 Seiten laufen lassen — 19 echte Fehler gefunden und behoben (fehlende `&nbsp;` in Telefonnummern auf allen Seiten, zu langer `<title>`, `<button>` ohne `type`, `<label>` mit zwei Controls im Kontaktformular, `<img src="">`-Anti-Pattern in der Lightbox). Fehlende `404.html` ergänzt (Netlify-Konvention) + lokaler Test-Server nachgerüstet. Markdownlint-Sweep über alle `docs/*.md` + `TODO.md` (130 → 5 verbleibende, bewusst akzeptierte Inline-HTML-Anker fürs Inhaltsverzeichnis). Sheet-Audit (`npm run check-sheet`) erneut gelaufen: 1 echter Datenfehler im **aktuell laufenden** Sheet gefunden (Brillantsalmler: Preis 3,25€ > Streichpreis 1,95€, vertauscht). Drive-Bild-Test erneut gelaufen: **alle 6 aktuellen Drive-Links zeigten kurzzeitig den Platzhalter** — Netzwerk-Log bestätigt HTTP 429 (Ratenlimit) auf dem primären Thumbnail-Endpunkt UND HTTP 403 auf dem `uc?export=view`-Fallback, mit hoher Wahrscheinlichkeit durch die eigene wiederholte Testerei in dieser Session ausgelöst, nicht durch normalen Website-Traffic. Fallback-Mechanismus hat wie vorgesehen funktioniert: kein kaputtes Bild, sauberer Platzhalter überall.
- [x] **Langzeit-Lösung für Angebots-Fotos (erledigt):** Automatischer Sync statt Drive-Direktzugriff. Das Google Sheet bleibt unverändert die Bedienoberfläche — für Joachim ändert sich **nichts**. Eine GitHub Action (`.github/workflows/sync-bilder.yml`, alle 2 Std. + manuell) lädt per `scripts/sync-sheet-images.mjs` die verlinkten Drive-Fotos, optimiert sie (AVIF/WebP/JPEG, 480 + 960 px) und committet sie; die Website nutzt bevorzugt diese Kopie und fällt nur für frisch eingetragene, noch nicht gesyncte Fotos übergangsweise auf Drive zurück (neuer Fisch also **sofort** sichtbar, binnen 2 Std. automatisch schnell). Gemessen: 360.445 → 25.936 Bytes pro Foto (79–93 % weniger). Robustheit: Sheet nicht erreichbar → Abbruch ohne Aufräumen; Download-Fehler → bisherige Kopie bleibt; geändertes Foto per SHA-256 erkannt; `Aktiv = nein` behält die Bilder. Doku: `docs/sync-log-erklaerung.md` (inkl. ehrlicher Kostenrechnung).
- [x] **2. Lighthouse-Endspurt:** alle 4 Seiten × mobil + Desktop gemessen (8 Läufe), Ergebnisse in `docs/lighthouse.md`. **Accessibility, Best Practices und SEO stehen überall auf 100** (Ausnahme mit Absicht: `/shop` SEO 69 wegen des gewollten `noindex` — steigt automatisch auf 100, sobald das `noindex` freigegeben und entfernt wird). Drei echte Fehler gefunden und behoben: (a) `heading-order` auf Impressum/Datenschutz (h1 → h3 ohne h2, Accessibility 96→100), (b) Drittanbieter-Cookie `NID` durch den Drive-`thumbnail`-Endpunkt (Best Practices 77→100; jetzt `lh3.googleusercontent.com` direkt, das setzt keinen Cookie und spart einen Redirect), (c) Lightbox-Bild ohne Maße/mit 1×1-Platzhalter (`unsized-images` + `image-size-responsive`). Performance lokal serverbedingt gedeckelt (einfacher Test-Server ohne HTTP/2, Kompression, Cache-Header) — verbindliche Messung erst nach echtem Deployment (Punkt 5).
- [x] **3. SEO-Endkontrolle:** Alle Seiten geprüft, Lighthouse **SEO 100** ohne offene Audits (Details: `docs/phase9-seo.md`). Behoben: zu lange Meta-Description der Startseite (178 → 141 Zeichen, wäre bei Google abgeschnitten worden); zehn Referenzbilder mit Platzhalter-Alt-Texten („Aquarium nach Maß 1–10") einzeln angesehen und beschrieben; veraltetes `lastmod` in der sitemap.xml; fehlendes `og:image:alt`; fehlende Open-Graph-Tags auf der Shop-Seite (wird per WhatsApp geteilt). Gegengeprüft und in Ordnung: JSON-LD valide und **Öffnungszeiten im Markup identisch mit den sichtbaren** (häufiger Abstrafungsgrund), OG-Bild echtes Foto in 1200×630, `/shop` korrekt **nicht** in der Sitemap solange `noindex`, robots.txt bewusst ohne `Disallow` (sonst könnte Google das `noindex` nicht lesen), alle Bilder mit `alt`. **⛔ Offen:** `noindex` auf `/shop` bleibt bis zur Freigabe; beim Entfernen zusätzlich `/shop` in die sitemap.xml aufnehmen.
- [x] **4. Funktions-Generalprobe:** Checkliste zum Abhaken erstellt → `docs/funktionstest-checkliste.md` (10 Bereiche, ca. 30–45 Min.). Deckt ab: Kontaktformular mit allen 4 Anliegen-Typen inkl. Spam-Zeitfalle, Newsletter-Double-Opt-in inkl. Abmeldelink, GoatCounter-Klick-Event, alle 5 Modals inkl. Fokus-Falle und Vorbelegung, Lightbox, Karte (mit Netzwerk-Gegenprobe, dass **vor** dem Klick nichts zu OSM geht), Telefon-/E-Mail-Links am echten Handy, 404 inkl. Statuscode-Prüfung, Sheet-Anbindung, Browser-Querschnitt. **Wichtiger Befund dabei:** Das Kontaktformular ist an **Netlify Forms** gebunden (`data-netlify="true"`, POST an `/`) — bei einem anderen Hoster gingen Anfragen **kommentarlos verloren**, der Besucher sähe trotzdem eine Erfolgsmeldung. Das entscheidet Punkt 5 vor. Ebenfalls vermerkt: Netlify-Formular-Benachrichtigung muss nach dem Deployment auf Joachims E-Mail eingerichtet werden, sonst liegen Anfragen nur im Dashboard.
- [x] **5. Hosting & Deployment:** **Netlify** gewählt (Begründung: das Kontaktformular ist über `data-netlify="true"` fest an Netlify Forms gebunden — bei Cloudflare wären Anfragen lautlos verloren gegangen; dazu die fertige `netlify.toml` und die Datenschutzerklärung, die Netlify bereits namentlich nennt). Projekt `zierfischparadies-erding` im Konto `jochen-jj1965` angelegt, Vorschau live unter <https://zierfischparadies-erding.netlify.app>. Build veröffentlicht bewusst nur `dist/` (Positivliste, siehe `scripts/build-site.mjs`). **Zwei echte Fehler dabei gefunden:** (a) Die CSP erlaubte `docs.google.com`, aber nicht das Weiterleitungsziel `*.googleusercontent.com` — Angebote/Neuzugänge waren live komplett blockiert; lokal unsichtbar, weil der Test-Server keine CSP sendet. (b) Netlify hatte `ignore_html_forms: true` gesetzt, das Formular wäre stillschweigend ins Leere gelaufen. Beides behoben und verifiziert (Testeintrag kam samt aller Felder an). Live gemessen: Startseite mobil 86/100/100/100, Desktop 95/100/100/100, `/impressum` 98, `/datenschutz` 99. **⛔ Offen:** GitHub-Auto-Deploy (Browser-Autorisierung nötig; ohne sie wirken die Bilder-Syncs nicht) und Formular-Benachrichtigung an `zierfischparadies-erding@web.de` eingerichtet, Empfang vom Nutzer noch zu bestätigen.
- [x] **6. Rechts-Check:** `docs/rechts-check-launch.md`. Alle extern kontaktierten Hosts aus dem Quellcode extrahiert und gegen die Datenschutzerklärung abgeglichen — alle sechs genutzten Dienste sind genannt, Formspree (nicht mehr genutzt) korrekt nicht, Facebook nur als Link ohne Einbettung. Datenschutzerklärung präzisiert: Produktfotos kommen seit dem Sync in aller Regel vom eigenen Server, eine Google-Verbindung entsteht dabei gar nicht mehr. Streitschlichtungs-Hinweis bewusst weggelassen (EU-ODR-Plattform seit Juli 2025 eingestellt; § 36 VSBG greift bei ≤10 Beschäftigten nicht — **bitte Beschäftigtenzahl bestätigen**). **⚠️ Weiterhin offen: juristische Prüfung der Texte.**
- [x] **7. Domain-Umzug-Anleitung:** `docs/launch-checkliste.md` komplett neu geschrieben, weil die Ausgangsannahme falsch war. **DNS-Analyse ergab: Die Domain läuft NICHT auf Strato.** Nameserver sind Strato, aber der A-Record zeigt auf `75.2.60.5` (Netlify), die Header sagen `Server: Netlify`, und ausgeliefert wird die alte Seite — **aus einem fremden Netlify-Konto**. Der Umzug ist also kein Hosting-Wechsel, sondern eine Domain-Übergabe zwischen zwei Netlify-Konten. Weg A (Zugang zum alten Konto, ohne DNS-Änderung, Ausfall unter einer Minute) und Weg B (über Strato-DNS mit TTL-Absenkung) dokumentiert, je mit Rollback. **Bewusst nicht ausgeführt:** die Domain unserem Projekt zuzuordnen — das hätte die echte Kundenseite ungetestet umschalten können. **🚨 Wichtigster Fund:** MX-Einträge zeigen auf `smtpin.rzone.de` — auf der Domain liegen E-Mail-Postfächer bei Strato. Eine Kündigung würde die E-Mails mitlöschen.
- [x] **8. Nach-Launch-Paket:** in `docs/launch-checkliste.md` integriert — Search Console (inkl. Umgang mit dem alten Verifizierungs-Tag `JEor7cRkWugFqFn…`), Bing per Import, Woche-1-Checkliste (Tag 1 / 2–3 / 4–7 / nach 2–4 Wochen) und eine Tabelle wiederkehrender Aufgaben (jährliche Domain-Verlängerung, HTTPS automatisch, GitHub-Action-Reaktivierung alle ~2 Monate).
- [x] **9. Übergabe-Dokument:** `docs/betriebshandbuch.md` + `docs/betriebshandbuch.pdf` in einfacher Sprache für Joachim und Laurenz — Angebote pflegen, Fotos hochladen, Klickzahlen ablesen, Newsletter verschicken, Fehlertabelle („was tun wenn…"), jährliche Aufgaben, Zugangsübersicht und eine Kurzfassung zum Aufhängen.

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

## Redesign „Beckenlicht" ✅ abgeschlossen

- [x] Auf Nutzerwunsch komplettes visuelles Redesign (Variante A aus Design-Vorschau gewählt): eigene Farbpalette (Petrol/Sand/Koralle), eigene Typografie (Quicksand + Inter), eigenes Wellen-/Lichtbrechungs-Motiv, Hero-Video beibehalten, Struktur/Sektionen/CMS-Anbindung unverändert — siehe `docs/redesign-beckenlicht.md`
- [x] Damit ist die Urheberrechtsfrage zum Original-Design (Andreas Fuchs, siehe `docs/analyse.md` Abschnitt 7) **gegenstandslos**: keine Ähnlichkeit mehr zu Farben/Typografie/Layout des Originals. Klarstellung: Der Andreas-Fuchs-Credit war nie im Code/Footer dieser neuen Seite enthalten, nur als Analyse-Fund dokumentiert.

## Offene Klärungen an den Nutzer

- [x] Reale Fotos vom Inhaber erhalten und eingebaut (Phase 8, Ordner „ki 1.1") — Hero-Video ist weiterhin das Original-Server-Asset
- [x] Hosting-Ziel bestätigt: Netlify (Nutzer-Entscheidung in Phase 1)
- [x] Formspree vs. natives Hosting-Formular: Netlify Forms gewählt (Phase 4), vom Nutzer nicht widersprochen
- [ ] Zugang/Berechtigung für Google Search Console Property klären (erst bei Phase-10-Ausführung relevant)
- [ ] Rechtstexte (Impressum/Datenschutz) juristisch prüfen lassen (Phase 7 — noch ausstehend)
- [ ] Echtes Google Sheet für Angebote einrichten, `SHEET_CSV_URL` in `assets/js/highlights.js` eintragen (Phase 2 — Code fertig, wartet auf Sheet)
- [ ] Freigabe für Phase 10 (Domain-Umzug/Launch)
