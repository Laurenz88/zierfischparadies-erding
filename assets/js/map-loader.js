/*
  Zwei-Klick-Loesung fuer die OpenStreetMap-Einbettung: Beim ersten
  Seitenaufruf wird KEINE Verbindung zu openstreetmap.org aufgebaut
  (Datenschutz + Ladezeit). Erst ein bewusster Klick laedt das iframe.
*/
(function () {
  var container = document.getElementById('contactMap');
  var btn = document.getElementById('mapLoadBtn');
  if (!container || !btn) return;

  btn.addEventListener('click', function () {
    var iframe = document.createElement('iframe');
    iframe.src = container.dataset.mapSrc;
    iframe.title = container.dataset.mapTitle || 'Standortkarte';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    container.innerHTML = '';
    container.appendChild(iframe);
  });
})();
