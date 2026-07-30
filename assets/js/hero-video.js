/*
  Laedt das Hero-Hintergrundvideo auf Desktop UND Handy.

  Nicht geladen wird es, wenn
  - der Nutzer reduzierte Bewegung wuenscht (Systemeinstellung
    "Animationen reduzieren"), oder
  - der Nutzer Datensparen aktiviert hat bzw. eine sehr langsame Verbindung
    gemeldet wird. Das Video ist 5,4 MB gross; auf einer 2G-Verbindung oder
    mit aktivem Datensparmodus waere das unhoeflich. In diesen Faellen bleibt
    das leichte Poster-Bild stehen (das per CSS langsam zoomt), sodass die
    Seite trotzdem lebendig wirkt.
*/
(function () {
  var hero = document.querySelector('.hero');
  if (!hero) return;

  var posterImg = hero.querySelector('.hero-poster-img');
  var mqReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function sparsameVerbindung() {
    var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return false;
    if (c.saveData) return true;
    return c.effectiveType === 'slow-2g' || c.effectiveType === '2g';
  }

  function shouldPlayVideo() {
    return !mqReduceMotion.matches && !sparsameVerbindung();
  }

  function injectVideo() {
    if (hero.querySelector('video.hero-media')) return;
    var video = document.createElement('video');
    video.className = 'hero-media';

    /* WICHTIG: Bei per JavaScript erzeugten <video>-Elementen genuegt
       setAttribute('muted','') NICHT. Browser entscheiden anhand der
       EIGENSCHAFT .muted, ob Autoplay ohne Nutzerinteraktion erlaubt ist.
       Wurde nur das Attribut gesetzt, blieb .muted auf false, der Browser
       verweigerte den Start (paused, currentTime 0) - das Video lud
       vollstaendig, zeigte aber nur ein Standbild. Genau dieser Fehler war
       auf dem Desktop zu sehen. defaultMuted setzt zusaetzlich das Attribut
       konsistent mit. */
    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = true;
    video.loop = true;
    video.playsInline = true;

    video.setAttribute('playsinline', '');
    video.setAttribute('preload', 'metadata');
    video.setAttribute('tabindex', '-1');
    video.setAttribute('aria-hidden', 'true');
    if (posterImg) video.poster = posterImg.src;

    var sourceWebm = document.createElement('source');
    sourceWebm.src = 'assets/video/hero-bg.webm';
    sourceWebm.type = 'video/webm';

    var sourceMp4 = document.createElement('source');
    sourceMp4.src = 'assets/video/hero-bg.mp4';
    sourceMp4.type = 'video/mp4';

    video.appendChild(sourceMp4);
    video.appendChild(sourceWebm);
    if (posterImg) posterImg.after(video);

    /* Poster erst ausblenden, wenn das Video wirklich LAEUFT - nicht schon
       bei "canplay". Sonst verschwindet das Poster, obwohl der Browser den
       Start verweigert hat, und man sieht ein eingefrorenes Standbild. */
    video.addEventListener('playing', function () {
      if (posterImg) posterImg.style.opacity = '0';
    }, { once: true });

    /* Autoplay zusaetzlich aktiv anstossen und Fehler abfangen. Verweigert
       der Browser trotzdem (strenge Einstellungen, Energiesparmodus),
       bleibt das Poster sichtbar und zoomt weiter - kein leerer Bereich. */
    var start = video.play();
    if (start && typeof start.catch === 'function') {
      start.catch(function () {
        if (posterImg) posterImg.style.opacity = '1';
      });
    }
  }

  function removeVideo() {
    var existing = hero.querySelector('video.hero-media');
    if (existing) existing.remove();
    if (posterImg) posterImg.style.opacity = '1';
  }

  function sync() {
    if (shouldPlayVideo()) injectVideo();
    else removeVideo();
  }

  sync();
  mqReduceMotion.addEventListener('change', sync);
})();
