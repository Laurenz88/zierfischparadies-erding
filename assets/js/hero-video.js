/*
  Laedt das Hero-Hintergrundvideo NUR auf breiteren Viewports und wenn der
  Nutzer keine reduzierte Bewegung wuenscht. Mobil bleibt es beim leichten
  Poster-Bild (Datenvolumen sparen, s. Analyse Phase 1 - Video war 22,5 MB).
*/
(function () {
  var hero = document.querySelector('.hero');
  if (!hero) return;

  var posterImg = hero.querySelector('.hero-poster-img');
  var mqDesktop = window.matchMedia('(min-width: 769px)');
  var mqReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function shouldPlayVideo() {
    return mqDesktop.matches && !mqReduceMotion.matches;
  }

  function injectVideo() {
    if (hero.querySelector('video.hero-media')) return;
    var video = document.createElement('video');
    video.className = 'hero-media';
    video.setAttribute('autoplay', '');
    video.setAttribute('loop', '');
    video.setAttribute('muted', '');
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

    video.addEventListener('canplay', function () {
      if (posterImg) posterImg.style.opacity = '0';
    }, { once: true });
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
  mqDesktop.addEventListener('change', sync);
  mqReduceMotion.addEventListener('change', sync);
})();
