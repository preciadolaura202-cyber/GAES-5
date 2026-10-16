/**
 * SegurIA — register.js
 * Lógica del formulario de registro de usuario.
 * 
 * TODO (Backend): Reemplazar handleRegister() por un fetch POST /api/auth/registro
 * que envíe { nombre, email, password } y redirija al panel tras éxito.
 */
"use strict";

(function () {
  const form              = document.getElementById('registerForm');
  const banner            = document.getElementById('registerBanner');
  const submitBtn         = document.getElementById('regSubmitBtn');

  const nombreInput       = document.getElementById('regNombre');
  const emailInput        = document.getElementById('regEmail');
  const passwordInput     = document.getElementById('regPassword');
  const passwordConfirm   = document.getElementById('regPasswordConfirm');
  const terminosCheck     = document.getElementById('regTerminos');

  const nombreWrap        = document.getElementById('regNombreWrap');
  const emailWrap         = document.getElementById('regEmailWrap');
  const passwordWrap      = document.getElementById('regPasswordWrap');
  const passwordConfirmWrap = document.getElementById('regPasswordConfirmWrap');

  const nombreErr         = document.getElementById('regNombreErr');
  const emailErr          = document.getElementById('regEmailErr');
  const passwordErr       = document.getElementById('regPasswordErr');
  const passwordConfirmErr = document.getElementById('regPasswordConfirmErr');

  const togglePasswordBtn = document.getElementById('toggleRegPassword');
  const eyeOpen           = document.getElementById('regEyeOpen');
  const eyeClosed         = document.getElementById('regEyeClosed');

  const strengthWrap      = document.getElementById('regStrengthWrap');
  const strengthText      = document.getElementById('regStrengthText');
  const strengthSegments  = document.querySelectorAll('#regStrengthWrap .strength-segment');

  // ── Visibilidad contraseña ──────────────────────────────────────────────
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      const isVisible = passwordInput.type === 'text';
      passwordInput.type = isVisible ? 'password' : 'text';
      togglePasswordBtn.setAttribute('aria-pressed', String(!isVisible));
      eyeOpen.style.display   = isVisible ? 'block' : 'none';
      eyeClosed.style.display = isVisible ? 'none'  : 'block';
    });
  }

  // ── Fortaleza de contraseña ─────────────────────────────────────────────
  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      if (!val) {
        strengthWrap.hidden = true;
        return;
      }
      strengthWrap.hidden = false;
      const score = calcStrength(val);
      renderStrength(score);
    });
  }

  function calcStrength(val) {
    let score = 0;
    if (val.length >= 8)  score++;
    if (val.length >= 12) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return Math.min(4, Math.floor(score / 5 * 4) + (score > 0 ? 1 : 0));
  }

  function renderStrength(score) {
    const levels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
    const classes = ['', 'active-weak', 'active-fair', 'active-good', 'active-strong'];
    strengthText.textContent = levels[score] || '';
    strengthSegments.forEach((seg, i) => {
      seg.className = 'strength-segment';
      if (i < score) seg.classList.add(classes[score]);
    });
  }

  // ── Validación de campos ────────────────────────────────────────────────
  function setError(input, wrap, errEl, msg) {
    wrap.classList.add('has-error');
    errEl.textContent = msg;
    errEl.hidden = false;
    input.setAttribute('aria-invalid', 'true');
    return false;
  }

  function clearError(input, wrap, errEl) {
    wrap.classList.remove('has-error');
    errEl.hidden = true;
    input.removeAttribute('aria-invalid');
    return true;
  }

  function validateNombre() {
    const val = nombreInput.value.trim();
    if (!val) return setError(nombreInput, nombreWrap, nombreErr, 'El nombre es requerido.');
    if (val.length < 3) return setError(nombreInput, nombreWrap, nombreErr, 'Mínimo 3 caracteres.');
    return clearError(nombreInput, nombreWrap, nombreErr);
  }

  function validateEmail() {
    const val = emailInput.value.trim();
    if (!val) return setError(emailInput, emailWrap, emailErr, 'El correo es requerido.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return setError(emailInput, emailWrap, emailErr, 'Ingresa un correo válido.');
    return clearError(emailInput, emailWrap, emailErr);
  }

  function validatePassword() {
    const val = passwordInput.value;
    if (!val) return setError(passwordInput, passwordWrap, passwordErr, 'La contraseña es requerida.');
    if (val.length < 8) return setError(passwordInput, passwordWrap, passwordErr, 'Mínimo 8 caracteres.');
    return clearError(passwordInput, passwordWrap, passwordErr);
  }

  function validateConfirm() {
    const val = passwordConfirm.value;
    if (!val) return setError(passwordConfirm, passwordConfirmWrap, passwordConfirmErr, 'Confirma tu contraseña.');
    if (val !== passwordInput.value) return setError(passwordConfirm, passwordConfirmWrap, passwordConfirmErr, 'Las contraseñas no coinciden.');
    return clearError(passwordConfirm, passwordConfirmWrap, passwordConfirmErr);
  }

  // Validación en tiempo real al perder foco
  nombreInput?.addEventListener('blur', validateNombre);
  emailInput?.addEventListener('blur', validateEmail);
  passwordInput?.addEventListener('blur', validatePassword);
  passwordConfirm?.addEventListener('blur', validateConfirm);
  passwordConfirm?.addEventListener('input', () => {
    if (passwordConfirm.value) validateConfirm();
  });

  // ── Envío del formulario ────────────────────────────────────────────────
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const v1 = validateNombre();
    const v2 = validateEmail();
    const v3 = validatePassword();
    const v4 = validateConfirm();
    const v5 = terminosCheck.checked;

    if (!v5) {
      showBanner('error', 'Debes aceptar los términos de la red comunitaria.');
    }

    if (!v1 || !v2 || !v3 || !v4 || !v5) return;

    // Simular envío al backend
    setLoading(true);
    showBanner('info', 'Procesando solicitud de registro…');

    // TODO: Reemplazar por: fetch(`${API_BASE}/api/auth/registro`, { method: 'POST', ... })
    await simulateDelay(1400);

    setLoading(false);
    showBanner('success', '¡Cuenta de demostración creada! Redirigiendo al panel…');

    // Guardar estado de sesión de demostración
    sessionStorage.setItem('seguria_demo_user', JSON.stringify({
      nombre: nombreInput.value.trim(),
      email: emailInput.value.trim(),
      modo: 'demo'
    }));

    await simulateDelay(1200);
    window.location.href = 'dashboard.html';
  });

  // ── Utilidades ──────────────────────────────────────────────────────────
  function showBanner(type, msg) {
    if (!banner) return;
    banner.className = `form-status-banner ${type}`;
    banner.textContent = msg;
    banner.hidden = false;
  }

  function setLoading(on) {
    if (!submitBtn) return;
    submitBtn.setAttribute('aria-busy', String(on));
    submitBtn.disabled = on;
  }

  function simulateDelay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }
})();
