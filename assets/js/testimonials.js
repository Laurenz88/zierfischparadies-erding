/*
  Laedt Kundenstimmen aus content/kundenstimmen.json (leicht erweiterbar,
  siehe Phase 3) und baut daraus den Slider (Karten pro Seite: 1 mobil,
  3 ab 900px - passend zu .testimonial-card in style.css).
*/
(function () {
  var track = document.getElementById('testimonialsTrack');
  var viewport = document.querySelector('.testimonials-viewport');
  var prevBtn = document.getElementById('sliderPrev');
  var nextBtn = document.getElementById('sliderNext');
  var dotsEl = document.getElementById('sliderDots');
  if (!track || !viewport || !prevBtn || !nextBtn || !dotsEl) return;

  var mqWide = window.matchMedia('(min-width: 900px)');
  var currentPage = 0;
  var cards = [];

  function esc(val) {
    return String(val == null ? '' : val)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/);
    return parts.slice(0, 2).map(function (p) { return p.charAt(0).toUpperCase(); }).join('');
  }

  function cardHtml(item) {
    var stars = Math.max(0, Math.min(5, item.stars || 5));
    return (
      '<blockquote class="testimonial-card">' +
        '<div class="testimonial-stars" aria-label="' + stars + ' von 5 Sternen">' + '★'.repeat(stars) + '</div>' +
        '<p class="testimonial-text">' + esc(item.text) + '</p>' +
        '<footer class="testimonial-author">' +
          '<div class="testimonial-avatar" aria-hidden="true">' + esc(initials(item.name)) + '</div>' +
          '<div>' +
            '<div class="testimonial-name">' + esc(item.name) + '</div>' +
            '<div class="testimonial-location">' + esc(item.location) + '</div>' +
          '</div>' +
        '</footer>' +
      '</blockquote>'
    );
  }

  function cardsPerPage() { return mqWide.matches ? 3 : 1; }
  function totalPages() { return Math.max(1, Math.ceil(cards.length / cardsPerPage())); }

  function pageOffset(page) {
    if (!cards.length) return 0;
    var cardWidth = cards[0].getBoundingClientRect().width;
    var gap = parseFloat(getComputedStyle(track).gap) || 0;
    return page * cardsPerPage() * (cardWidth + gap);
  }

  function update() {
    var pages = totalPages();
    currentPage = Math.max(0, Math.min(currentPage, pages - 1));
    track.style.transform = 'translateX(-' + pageOffset(currentPage) + 'px)';
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= pages - 1;
    dotsEl.querySelectorAll('.slider-dot').forEach(function (dot, i) {
      var active = i === currentPage;
      dot.classList.toggle('active', active);
      dot.setAttribute('aria-selected', String(active));
    });
  }

  function buildDots() {
    var pages = totalPages();
    dotsEl.innerHTML = '';
    for (var i = 0; i < pages; i++) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'slider-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Seite ' + (i + 1) + ' von ' + pages);
      dot.addEventListener('click', (function (page) {
        return function () { currentPage = page; update(); };
      })(i));
      dotsEl.appendChild(dot);
    }
  }

  function render(items) {
    track.innerHTML = items.map(cardHtml).join('');
    cards = Array.from(track.querySelectorAll('.testimonial-card'));
    buildDots();
    update();
  }

  prevBtn.addEventListener('click', function () {
    if (currentPage > 0) { currentPage--; update(); }
  });
  nextBtn.addEventListener('click', function () {
    if (currentPage < totalPages() - 1) { currentPage++; update(); }
  });

  var touchStartX = 0;
  viewport.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });
  viewport.addEventListener('touchend', function (e) {
    var diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextBtn.click(); else prevBtn.click();
    }
  }, { passive: true });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { buildDots(); update(); }, 150);
  });

  fetch('content/kundenstimmen.json')
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (items) {
      if (!Array.isArray(items) || !items.length) throw new Error('Keine Kundenstimmen gefunden');
      render(items);
    })
    .catch(function (err) {
      console.error('[Kundenstimmen] konnten nicht geladen werden:', err);
      track.innerHTML = '<p class="highlights-status-msg">Kundenstimmen sind derzeit nicht verfügbar.</p>';
    });
})();
