/**
 * SegurIA — register.js
 * Lógica del formulario de registro de usuario con persistencia en MySQL (phpMyAdmin)
 * y fondo táctico interactivo en Canvas.
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

  const API_BASE = window.SEGURIA_API_BASE || 'http://127.0.0.1:8000';

  // ── Fondo Táctico Canvas Radar ──────────────────────────────────────────
  const canvas = document.getElementById('bgCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let animId = null;
    let radarAngle = 0;
    let streetLines = [];
    let riskNodes = [];

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      buildGrid(canvas.width, canvas.height);
    };

    function buildGrid(w, h) {
      streetLines = [];
      riskNodes = [];
      const cols = 12;
      const rows = 8;
      const cStep = w / cols;
      const rStep = h / rows;

      for (let i = 1; i < rows; i++) {
        streetLines.push({ x1: 0, y1: i * rStep, x2: w, y2: i * rStep, alpha: (i % 2 === 0) ? 0.08 : 0.03 });
      }
      for (let j = 1; j < cols; j++) {
        streetLines.push({ x1: j * cStep, y1: 0, x2: j * cStep, y2: h, alpha: (j % 3 === 0) ? 0.08 : 0.03 });
      }

      const points = [
        { x: w * 0.2, y: h * 0.3, color: 'rgba(34, 197, 94, 0.4)' },
        { x: w * 0.75, y: h * 0.25, color: 'rgba(234, 179, 8, 0.5)' },
        { x: w * 0.8, y: h * 0.7, color: 'rgba(239, 68, 68, 0.5)' },
        { x: w * 0.3, y: h * 0.8, color: 'rgba(34, 197, 94, 0.4)' },
      ];
      points.forEach(p => riskNodes.push({ ...p, phase: Math.random() * Math.PI }));
    }

    function draw() {
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Líneas de mapa
      streetLines.forEach(l => {
        ctx.strokeStyle = `rgba(56, 189, 248, ${l.alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
        ctx.stroke();
      });

      // Nodos tácticos
      riskNodes.forEach(n => {
        n.phase += 0.03;
        const rad = 8 + Math.sin(n.phase) * 4;
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, rad, 0, Math.PI * 2);
        ctx.fill();
      });

      // Barrido de radar
      radarAngle += 0.015;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const r = Math.max(w, h) * 0.6;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, radarAngle - 0.25, radarAngle);
      ctx.lineTo(cx, cy);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.03)';
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', resize);
    resize();
    draw();
  }

  // ── Visibilidad contraseña ──────────────────────────────────────────────
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isVisible = passwordInput.type === 'text';
      passwordInput.type = isVisible ? 'password' : 'text';
      togglePasswordBtn.setAttribute('aria-pressed', String(!isVisible));
      if (eyeOpen) eyeOpen.style.display   = isVisible ? 'block' : 'none';
      if (eyeClosed) eyeClosed.style.display = isVisible ? 'none'  : 'block';
    });
  }

  // ── Fortaleza de contraseña ─────────────────────────────────────────────
  if (passwordInput && strengthWrap) {
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
    if (val.length >= 6)  score++;
    if (val.length >= 10) score++;
    if (/[A-Z]/.test(val) && /[a-z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    return Math.min(4, Math.max(1, score));
  }

  function renderStrength(score) {
    if (!strengthText || !strengthSegments) return;
    const levels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
    const classes = ['', 'active-weak', 'active-fair', 'active-good', 'active-strong'];
    strengthText.textContent = levels[score] || 'Débil';
    strengthSegments.forEach((seg, i) => {
      seg.className = 'strength-segment';
      if (i < score) seg.classList.add(classes[score]);
    });
  }

  // ── Validación de campos ────────────────────────────────────────────────
  function setError(input, wrap, errEl, msg) {
    if (wrap) wrap.classList.add('has-error');
    if (errEl) {
      errEl.textContent = msg;
      errEl.hidden = false;
    }
    if (input) input.setAttribute('aria-invalid', 'true');
    return false;
  }

  function clearError(input, wrap, errEl) {
    if (wrap) wrap.classList.remove('has-error');
    if (errEl) {
      errEl.hidden = true;
      errEl.textContent = '';
    }
    if (input) input.removeAttribute('aria-invalid');
    return true;
  }

  function validateNombre() {
    const val = nombreInput?.value.trim() || '';
    if (!val) return setError(nombreInput, nombreWrap, nombreErr, 'El nombre completo es requerido.');
    if (val.length < 3) return setError(nombreInput, nombreWrap, nombreErr, 'Mínimo 3 caracteres.');
    return clearError(nombreInput, nombreWrap, nombreErr);
  }

  function validateEmail() {
    const val = emailInput?.value.trim() || '';
    if (!val) return setError(emailInput, emailWrap, emailErr, 'El correo electrónico es requerido.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return setError(emailInput, emailWrap, emailErr, 'Ingresa un correo válido (ej. usuario@correo.com).');
    return clearError(emailInput, emailWrap, emailErr);
  }

  function validatePassword() {
    const val = passwordInput?.value || '';
    if (!val) return setError(passwordInput, passwordWrap, passwordErr, 'La contraseña es requerida.');
    if (val.length < 6) return setError(passwordInput, passwordWrap, passwordErr, 'Mínimo 6 caracteres.');
    return clearError(passwordInput, passwordWrap, passwordErr);
  }

  function validateConfirm() {
    const val = passwordConfirm?.value || '';
    if (!val) return setError(passwordConfirm, passwordConfirmWrap, passwordConfirmErr, 'Confirma tu contraseña.');
    if (val !== passwordInput?.value) return setError(passwordConfirm, passwordConfirmWrap, passwordConfirmErr, 'Las contraseñas no coinciden.');
    return clearError(passwordConfirm, passwordConfirmWrap, passwordConfirmErr);
  }

  // Validación en tiempo real
  nombreInput?.addEventListener('blur', validateNombre);
  emailInput?.addEventListener('blur', validateEmail);
  passwordInput?.addEventListener('blur', validatePassword);
  passwordConfirm?.addEventListener('blur', validateConfirm);
  passwordConfirm?.addEventListener('input', () => {
    if (passwordConfirm.value) validateConfirm();
  });

  terminosCheck?.addEventListener('change', () => {
    if (terminosCheck.checked && banner && banner.textContent.includes('términos')) {
      banner.hidden = true;
    }
  });

  // ── Envío del formulario ────────────────────────────────────────────────
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const v1 = validateNombre();
    const v2 = validateEmail();
    const v3 = validatePassword();
    const v4 = validateConfirm();
    const v5 = terminosCheck ? terminosCheck.checked : true;

    if (!v1 || !v2 || !v3 || !v4) {
      showBanner('error', 'Por favor completa todos los campos obligatorios correctamente.');
      // Enfocar el primer campo inválido
      if (!v1) nombreInput?.focus();
      else if (!v2) emailInput?.focus();
      else if (!v3) passwordInput?.focus();
      else if (!v4) passwordConfirm?.focus();
      return;
    }

    if (!v5) {
      showBanner('error', 'Debes aceptar los términos de la red comunitaria.');
      terminosCheck?.focus();
      return;
    }

    setLoading(true);
    showBanner('info', 'Guardando usuario en la base de datos MySQL...');

    const payload = {
      nombre: nombreInput.value.trim(),
      correo: emailInput.value.trim(),
      clave: passwordInput.value
    };

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setLoading(false);
        const errorMsg = data.detail || data.error || 'No se pudo registrar el usuario.';
        showBanner('error', `Error: ${errorMsg}`);
        return;
      }

      setLoading(false);
      showBanner('success', '¡Cuenta creada y guardada en MySQL! Redirigiendo al inicio de sesión…');

      // Guardar información del usuario registrado en sesión
      sessionStorage.setItem('seguria_user', JSON.stringify(data.usuario));
      sessionStorage.setItem('seguria_demo_user', JSON.stringify({
        id: data.usuario?.id,
        nombre: data.usuario?.nombre || payload.nombre,
        email: data.usuario?.correo || payload.correo,
        modo: 'db'
      }));

      await simulateDelay(1500);
      window.location.href = 'login.html';

    } catch (networkError) {
      setLoading(false);
      console.error('[SegurIA] Error al conectar con el backend:', networkError);
      showBanner(
        'error',
        'No se pudo conectar con el servidor backend Python (http://127.0.0.1:8000). Asegúrate de iniciar Laragon/XAMPP (MySQL) y ejecutar iniciar-backend.bat.'
      );
    }
  });

  // ── Utilidades ──────────────────────────────────────────────────────────
  function showBanner(type, msg) {
    if (!banner) return;
    banner.className = `form-status-banner ${type}`;
    banner.textContent = msg;
    banner.hidden = false;
    banner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
