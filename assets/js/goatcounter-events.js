/*
  Verallgemeinertes Klick-Tracking fuer GoatCounter: jedes Element mit
  data-goatcounter-event="..." meldet beim Anklicken ein eigenes Event
  (nicht nur einen Seitenaufruf). Genutzt aktuell fuer die "Online-Shop"-
  Buttons in Navigation und Hero. Falls count.js noch nicht geladen ist
  (z. B. sehr schneller Klick direkt nach Seitenaufruf), wird der Klick
  einfach nicht gezaehlt - die eigentliche Navigation wird dadurch nie
  blockiert oder verzoegert.
*/
(function () {
  document.querySelectorAll('[data-goatcounter-event]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (window.goatcounter && typeof window.goatcounter.count === 'function') {
        window.goatcounter.count({
          path: el.dataset.goatcounterEvent,
          title: el.dataset.goatcounterTitle || el.dataset.goatcounterEvent,
          event: true
        });
      }
    });
  });
})();
