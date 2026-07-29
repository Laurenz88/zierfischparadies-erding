(function () {
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (!nav || !navToggle || !navLinks) return;

  window.addEventListener('scroll', function () {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // Menue-Zustand an einer Stelle setzen, damit Panel, Burger-Symbol,
  // Scroll-Sperre und die Nav-Klasse nie auseinanderlaufen koennen.
  // Die Klasse "menu-open" auf der Nav schaltet ausserdem den
  // backdrop-filter ab (siehe Kommentar in style.css) - ohne das bezieht
  // sich das fixed positionierte Menue nicht mehr aufs Fenster.
  function setMenu(open) {
    navLinks.classList.toggle('open', open);
    navToggle.classList.toggle('active', open);
    nav.classList.toggle('menu-open', open);
    document.body.classList.toggle('nav-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  }

  function isOpen() { return navLinks.classList.contains('open'); }

  navToggle.addEventListener('click', function () {
    setMenu(!isOpen());
  });

  // Tippen ausserhalb des Menues schliesst es. Klicks auf den Burger selbst
  // sind ausgenommen, sonst wuerde das direkt anschliessende Toggle den
  // Zustand sofort wieder umkehren.
  document.addEventListener('click', function (e) {
    if (!isOpen()) return;
    if (navLinks.contains(e.target) || navToggle.contains(e.target)) return;
    setMenu(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) {
      setMenu(false);
      navToggle.focus();
    }
  });

  // Wird auf Desktopbreite vergroessert, waehrend das Menue offen ist,
  // muss der Zustand zurueckgesetzt werden - sonst bliebe die Seite gesperrt.
  var mqDesktop = window.matchMedia('(min-width: 768px)');
  var onDesktopChange = function (e) { if (e.matches && isOpen()) setMenu(false); };
  if (mqDesktop.addEventListener) mqDesktop.addEventListener('change', onDesktopChange);
  else if (mqDesktop.addListener) mqDesktop.addListener(onDesktopChange);

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
      setMenu(false);

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
