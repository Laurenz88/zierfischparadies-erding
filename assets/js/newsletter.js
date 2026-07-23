/*
  Newsletter-Anmeldung (Brevo/Sendinblue, Double-Opt-in).
  Brevos Formular-Endpunkt (sibforms.com) unterstuetzt kein CORS, daher
  "no-cors": Wir erhalten keine lesbare Antwort und behandeln das
  Absenden selbst als Erfolg. Die eigentliche Bestaetigung erfolgt per
  Double-Opt-in-E-Mail durch Brevo.
*/
(function () {
  var form = document.getElementById('newsletterForm');
  if (!form) return;

  var statusEl = form.querySelector('.form-status');
  var submitBtn = form.querySelector('button[type="submit"]');
  var emailInput = form.querySelector('#newsletterEmail');

  function setStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.hidden = !message;
    statusEl.className = 'form-status' + (type ? ' ' + type : '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      setStatus('Bitte eine gültige E-Mail-Adresse eingeben.', 'error');
      if (emailInput) emailInput.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird gesendet …';

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      mode: 'no-cors'
    })
      .then(function () {
        setStatus('Fast geschafft! Bitte bestätige die Anmeldung über den Link in der E-Mail, die wir dir gerade geschickt haben.', 'success');
        submitBtn.textContent = '✓ Angemeldet';
        form.reset();
      })
      .catch(function (err) {
        console.error('[Newsletter]', err);
        setStatus('Da ist leider etwas schiefgelaufen. Bitte später erneut versuchen.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Abonnieren';
      });
  });
})();
