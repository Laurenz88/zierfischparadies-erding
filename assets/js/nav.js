(function () {
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (!nav || !navToggle || !navLinks) return;

  window.addEventListener('scroll', function () {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  navToggle.addEventListener('click', function () {
    var isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('active', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function scrollToTarget(target, smooth) {
    target.scrollIntoView({ block: 'start', behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
  }

  // Direkter Aufruf mit #anker (externer Link, Bookmark): Der native
  // Browser-Sprung erfolgt oft, bevor Layout/Fonts fertig geladen sind und
  // landet dadurch an falscher Position. Nach vollstaendigem Laden (plus
  // ein Frame Puffer fuer asynchrone Layout-Aenderungen) einmal korrigieren.
  // scroll-margin-top auf .section sorgt fuer den Abstand zur fixed Nav.
  if (window.location.hash) {
    window.addEventListener('load', function () {
      var target = document.querySelector(window.location.hash);
      if (!target) return;
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { scrollToTarget(target, false); });
      });
    });
  }

  navLinks.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');

      var targetId = link.getAttribute('href');
      var target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      scrollToTarget(target, true);
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
})();
