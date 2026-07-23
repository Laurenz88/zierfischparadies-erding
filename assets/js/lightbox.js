(function () {
  var overlay = document.getElementById('paradiesLightbox');
  var imgEl = document.getElementById('paradiesLightboxImg');
  var counterEl = document.getElementById('paradiesCounter');
  var prevBtn = document.getElementById('paradiesPrev');
  var nextBtn = document.getElementById('paradiesNext');
  if (!overlay || !imgEl) return;

  var images = Array.from(overlay.querySelectorAll('.lightbox-thumbs img')).map(function (img) {
    return { src: img.currentSrc || img.src, alt: img.alt };
  });
  var current = 0;

  function show(idx) {
    if (!images.length) return;
    current = ((idx % images.length) + images.length) % images.length;
    imgEl.src = images[current].src;
    imgEl.alt = images[current].alt;
    imgEl.hidden = false;
    if (counterEl) counterEl.textContent = (current + 1) + ' / ' + images.length;
  }

  document.querySelectorAll('[data-modal="paradiesLightbox"]').forEach(function (trigger) {
    trigger.addEventListener('click', function () { show(0); });
  });

  if (prevBtn) prevBtn.addEventListener('click', function (e) { e.stopPropagation(); show(current - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function (e) { e.stopPropagation(); show(current + 1); });

  overlay.addEventListener('keydown', function (e) {
    if (!overlay.classList.contains('active')) return;
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
})();
