/*
  Eigene Galerie des Inhabers: Fotos liegen in content/galerie/, eine
  einfache Liste ihrer Dateinamen steht in content/galerie.json (siehe
  docs/anleitung-bilder.md). Bewusst KEIN Rate-/Sondierungsmechanismus
  (z. B. "probiere foto-1.jpg, foto-2.jpg, ... durch"): das wuerde bei
  jedem nicht vorhandenen Bild eine "Failed to load resource"-Meldung
  in der Browser-Konsole erzeugen und die Lighthouse-Bewertung
  "Best Practices" verschlechtern. Die Liste existiert stattdessen
  immer (auch leer als "[]"), damit nie ins Leere geladen wird.
*/
(function () {
  var section = document.getElementById('eigene-galerie');
  var track = document.getElementById('ownerGalleryTrack');
  if (!section || !track) return;

  function cardHtml(filename, index, hidden) {
    var src = 'content/galerie/' + filename;
    var alt = hidden ? '' : ('Foto ' + index + ' aus dem Zierfischparadies Erding');
    return (
      '<img class="refs-img" src="' + src + '" alt="' + alt + '"' +
      (hidden ? ' aria-hidden="true"' : '') +
      ' loading="lazy" decoding="async">'
    );
  }

  function renderGallery() {
    fetch('content/galerie.json')
      .then(function (res) { return res.ok ? res.json() : []; })
      .then(function (files) {
        if (!Array.isArray(files) || !files.length) return;
        var real = files.map(function (f, i) { return cardHtml(f, i + 1, false); }).join('');
        var duplicate = files.map(function (f, i) { return cardHtml(f, i + 1, true); }).join('');
        track.innerHTML = real + duplicate;
        section.hidden = false;
      })
      .catch(function () {});
  }

  // Erst nach dem eigentlichen Seitenaufbau starten, damit dieser
  // zusaetzliche Abruf nicht mit wichtigeren Ressourcen (Hero, Fonts)
  // um Bandbreite konkurriert.
  if (document.readyState === 'complete') {
    renderGallery();
  } else {
    window.addEventListener('load', renderGallery);
  }
})();
