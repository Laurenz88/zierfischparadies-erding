/*
  Intelligentes Kontaktformular:
  - dynamische Zusatzfelder je nach "Anliegen"
  - Spam-Schutz ohne Cookies: Honeypot-Feld + Zeitfalle (< 3s = vermutlich Bot)
  - Client-seitige Validierung mit verstaendlichen Fehlermeldungen
  - AJAX-Versand an Netlify Forms, Erfolg/Fehler ohne Seiten-Reload
  - Ohne JavaScript funktioniert das Formular weiterhin per normalem
    POST (progressive enhancement), nur ohne die dynamischen Extras.
*/
(function () {
  var form = document.getElementById('contactForm');
  if (!form) return;

  var anliegenSelect = document.getElementById('anliegen');
  var dynamicFields = document.getElementById('dynamic-fields');
  var aquariumRow = dynamicFields ? dynamicFields.querySelector('.dynamic-aquarium') : null;
  var nachzuchtRow = dynamicFields ? dynamicFields.querySelector('.dynamic-nachzucht') : null;
  var statusEl = form.querySelector('.form-status');
  var submitBtn = form.querySelector('button[type="submit"]');
  var honeypot = form.querySelector('#bot-field');
  var loadedAt = Date.now();
  var MIN_SECONDS = 3;

  function updateDynamicFields() {
    var value = anliegenSelect ? anliegenSelect.value : '';
    var isAquarium = value === 'aquariumbau';
    var isNachzucht = value === 'nachzucht';
    if (dynamicFields) dynamicFields.classList.toggle('visible', isAquarium || isNachzucht);
    if (aquariumRow) aquariumRow.style.display = isAquarium ? '' : 'none';
    if (nachzuchtRow) nachzuchtRow.style.display = isNachzucht ? '' : 'none';
  }

  function selectAnliegen(value) {
    if (!anliegenSelect) return;
    anliegenSelect.value = value;
    updateDynamicFields();
  }

  if (anliegenSelect) {
    anliegenSelect.addEventListener('change', updateDynamicFields);
    updateDynamicFields();
  }

  // Von den Leistungs-Karten aus das passende Anliegen vorbelegen
  document.querySelectorAll('[data-anliegen]').forEach(function (el) {
    el.addEventListener('click', function () { selectAnliegen(el.dataset.anliegen); });
  });
  // Von den Leistungs-Modals aus ("Zum Kontaktformular")
  document.querySelectorAll('[data-select-anliegen]').forEach(function (el) {
    el.addEventListener('click', function () { selectAnliegen(el.dataset.selectAnliegen); });
  });

  function setStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.hidden = !message;
    statusEl.className = 'form-status' + (type ? ' ' + type : '');
  }

  function clearFieldErrors() {
    form.querySelectorAll('.form-field-error').forEach(function (el) { el.remove(); });
    form.querySelectorAll('.touched').forEach(function (el) { el.classList.remove('touched'); });
  }

  function showFieldErrors() {
    var invalid = Array.prototype.filter.call(form.elements, function (el) {
      return el.willValidate && !el.checkValidity();
    });
    invalid.forEach(function (el) {
      el.classList.add('touched');
      var msg = document.createElement('p');
      msg.className = 'form-field-error';
      msg.textContent = el.validationMessage || 'Bitte dieses Feld ausfüllen.';
      el.insertAdjacentElement('afterend', msg);
    });
    return invalid[0];
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearFieldErrors();
    setStatus('', '');

    // Honeypot: unsichtbares Feld ausgefuellt -> vermutlich Bot, tun als
    // waere alles gut, aber nichts absenden (kein Hinweis an den Bot).
    if (honeypot && honeypot.value.trim() !== '') {
      setStatus('Vielen Dank für Ihre Nachricht!', 'success');
      form.reset();
      return;
    }

    // Zeitfalle: Formulare, die schneller als MIN_SECONDS ausgefuellt
    // wurden, stammen erfahrungsgemaess nicht von echten Menschen.
    var elapsedSeconds = (Date.now() - loadedAt) / 1000;
    if (elapsedSeconds < MIN_SECONDS) {
      setStatus('Bitte kurz warten und das Formular erneut absenden.', 'error');
      return;
    }

    if (!form.checkValidity()) {
      var firstInvalid = showFieldErrors();
      setStatus('Bitte überprüfen Sie die rot markierten Felder.', 'error');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    var formData = new FormData(form);
    var body = new URLSearchParams();
    formData.forEach(function (value, key) { body.append(key, value); });

    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird gesendet …';

    fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        setStatus('Vielen Dank! Ihre Anfrage ist bei uns eingegangen – wir melden uns schnellstmöglich.', 'success');
        form.reset();
        updateDynamicFields();
      })
      .catch(function (err) {
        console.error('[Kontaktformular]', err);
        setStatus('Da ist leider etwas schiefgelaufen. Bitte versuchen Sie es erneut oder rufen Sie uns an: 08122 / 2289417.', 'error');
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Anfrage absenden';
      });
  });
})();
