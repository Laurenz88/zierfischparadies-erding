(function () {
  var modals = document.querySelectorAll('.modal-overlay');
  if (!modals.length) return;
  var activeModal = null;
  var lastFocused = null;

  // Das Kontaktformular wird beim Oeffnen eines Leistungs-Modals mit
  // einem Kontakt-Platzhalter ([data-contact-slot]) dorthin verschoben
  // (nicht kopiert, damit bestehende Event-Listener erhalten bleiben)
  // und beim Schliessen wieder an seinen Ursprungsort zurueckgestellt.
  var contactForm = document.querySelector('.contact-form-card');
  var contactFormHome = contactForm ? contactForm.parentNode : null;
  var contactFormNextSibling = contactForm ? contactForm.nextSibling : null;

  function moveContactFormInto(modal) {
    if (!contactForm) return;
    var slot = modal.querySelector('[data-contact-slot]');
    if (!slot) return;
    slot.appendChild(contactForm);
  }

  function restoreContactForm() {
    if (!contactForm || !contactFormHome) return;
    if (contactFormNextSibling && contactFormNextSibling.parentNode === contactFormHome) {
      contactFormHome.insertBefore(contactForm, contactFormNextSibling);
    } else {
      contactFormHome.appendChild(contactForm);
    }
  }

  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    lastFocused = document.activeElement;
    activeModal = modal;
    moveContactFormInto(modal);
    modal.classList.add('active');
    document.body.classList.add('modal-open');
    var closeBtn = modal.querySelector('.modal-close, [data-close]');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal(modal) {
    modal.classList.remove('active');
    document.body.classList.remove('modal-open');
    activeModal = null;
    restoreContactForm();
    if (lastFocused) lastFocused.focus();
  }

  document.querySelectorAll('[data-modal]').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      openModal(trigger.dataset.modal);
    });
  });

  modals.forEach(function (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal(modal);
    });
    var inner = modal.querySelector('.modal');
    if (inner) inner.addEventListener('click', function (e) { e.stopPropagation(); });
    modal.querySelectorAll('[data-close]').forEach(function (el) {
      el.addEventListener('click', function () { closeModal(modal); });
    });

    modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var focusable = modal.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && activeModal) closeModal(activeModal);
  });
})();
