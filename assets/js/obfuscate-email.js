/*
  E-Mail-Adressen vor einfachen Harvester-Bots schuetzen: Im HTML steht
  nur der Nutzer- und Domain-Teil getrennt in data-Attributen, nicht als
  zusammenhaengende Adresse. Erst zur Laufzeit im Browser wird daraus
  ein echter mailto-Link.

  Verwendung (z.B. im Impressum, Phase 7):
  <a class="obfuscated-email" data-user="zierfischparadies-erding" data-domain="web.de">
    E-Mail wird geladen …
  </a>
*/
(function () {
  document.querySelectorAll('.obfuscated-email').forEach(function (el) {
    var user = el.dataset.user;
    var domain = el.dataset.domain;
    if (!user || !domain) return;
    var address = user + '@' + domain;
    el.textContent = address;
    el.setAttribute('href', 'mailto:' + address);
  });
})();
