/*
  Positionsanzeige fuer das mobile Karussell der Angebote/Neuzugaenge.

  Das Wischen selbst macht der Browser (CSS: overflow-x + scroll-snap) - das
  ist fluessiger und stromsparender als eine JS-Loesung und funktioniert auch,
  wenn dieses Skript nicht laedt. Hier kommt nur dazu:
  - Punkte, die zeigen, wo man sich befindet
  - Antippen eines Punktes springt zur Karte
  - Tastaturbedienung des Scrollbereichs (sonst bemaengelt es die
    Barrierefreiheitspruefung: "scrollable region must have keyboard access")

  Die Karten werden von highlights.js nachtraeglich eingefuegt; deshalb wartet
  dieses Skript auf das Ereignis "highlights:gerendert".
*/
(function () {
  var mqMobil = window.matchMedia('(max-width: 599px)');

  function karten(grid) {
    return Array.prototype.slice.call(grid.querySelectorAll('.product-card'));
  }

  function einrichten(grid) {
    var liste = karten(grid);

    // Vorherige Anzeige entfernen (z. B. wenn das Sheet neu gerendert wurde)
    var alt = grid.parentNode.querySelector('.product-carousel-dots');
    if (alt) alt.remove();

    // Scrollbereich per Tastatur erreichbar machen, aber nur wenn er
    // tatsaechlich scrollt - sonst entstuende ein nutzloser Tab-Stopp.
    var scrollt = mqMobil.matches && liste.length > 1;
    if (scrollt) {
      grid.setAttribute('tabindex', '0');
      grid.setAttribute('role', 'group');
      grid.setAttribute('aria-label', 'Zum Blättern seitlich wischen');
    } else {
      grid.removeAttribute('tabindex');
      grid.removeAttribute('role');
      grid.removeAttribute('aria-label');
    }

    if (liste.length < 2) return;

    var dots = document.createElement('div');
    dots.className = 'product-carousel-dots';
    // Fuer Screenreader ueberfluessig: Die Karten selbst sind bereits im
    // Textfluss lesbar, die Punkte sind reine Sehhilfe.
    dots.setAttribute('aria-hidden', 'true');

    liste.forEach(function (karte, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.tabIndex = -1;
      b.addEventListener('click', function () {
        grid.scrollTo({ left: karte.offsetLeft - grid.offsetLeft, behavior: 'smooth' });
      });
      dots.appendChild(b);
    });
    grid.parentNode.insertBefore(dots, grid.nextSibling);

    var knoepfe = Array.prototype.slice.call(dots.children);
    function markiere() {
      // Karte, deren Mitte der Mitte des Sichtfensters am naechsten liegt
      var mitte = grid.scrollLeft + grid.clientWidth / 2;
      var beste = 0;
      var kleinsterAbstand = Infinity;
      liste.forEach(function (k, i) {
        var kMitte = k.offsetLeft - grid.offsetLeft + k.offsetWidth / 2;
        var abstand = Math.abs(kMitte - mitte);
        if (abstand < kleinsterAbstand) { kleinsterAbstand = abstand; beste = i; }
      });
      knoepfe.forEach(function (b, i) {
        if (i === beste) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
    }

    var wartet = false;
    grid.addEventListener('scroll', function () {
      // Auf den naechsten Bildaufbau buendeln, damit das Wischen nicht ruckelt
      if (wartet) return;
      wartet = true;
      requestAnimationFrame(function () { wartet = false; markiere(); });
    }, { passive: true });

    markiere();
  }

  function alleEinrichten() {
    ['angebote-grid', 'neuheiten-grid'].forEach(function (id) {
      var grid = document.getElementById(id);
      if (grid) einrichten(grid);
    });
  }

  document.addEventListener('highlights:gerendert', alleEinrichten);
  // Falls die Karten schon stehen (Skript-Reihenfolge, Cache)
  if (document.readyState !== 'loading') alleEinrichten();
  else document.addEventListener('DOMContentLoaded', alleEinrichten);

  // Beim Wechsel zwischen Handy- und Desktopbreite neu bewerten
  var beiWechsel = function () { alleEinrichten(); };
  if (mqMobil.addEventListener) mqMobil.addEventListener('change', beiWechsel);
  else if (mqMobil.addListener) mqMobil.addListener(beiWechsel);
})();
