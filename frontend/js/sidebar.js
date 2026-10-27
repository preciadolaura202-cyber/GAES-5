/**
 * SegurIA — sidebar.js
 * Lógica compartida de apertura/cierre de la barra lateral en móvil.
 * Incluido en todas las páginas de la app.
 */
"use strict";

(function () {
  const sidebar         = document.getElementById('sidebar');
  const sidebarOverlay  = document.getElementById('sidebarOverlay');
  const hamburgerBtn    = document.getElementById('hamburgerBtn');
  const sidebarCloseBtn = document.getElementById('sidebarCloseBtn');

  if (!sidebar) return;

  function openSidebar() {
    sidebar.classList.add('is-open');
    sidebarOverlay.classList.add('is-visible');
    sidebarOverlay.removeAttribute('aria-hidden');
    if (hamburgerBtn) {
      hamburgerBtn.setAttribute('aria-expanded', 'true');
    }
    // Bloquear scroll del body en móvil
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    sidebar.classList.remove('is-open');
    sidebarOverlay.classList.remove('is-visible');
    sidebarOverlay.setAttribute('aria-hidden', 'true');
    if (hamburgerBtn) {
      hamburgerBtn.setAttribute('aria-expanded', 'false');
    }
    document.body.style.overflow = '';
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', openSidebar);
  }

  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', closeSidebar);
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebar);
  }

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('is-open')) {
      closeSidebar();
    }
  });

  // Mostrar datos del usuario autenticado en la barra lateral
  try {
    const rawUser = sessionStorage.getItem('seguria_user') || sessionStorage.getItem('seguria_demo_user');
    if (rawUser) {
      const user = JSON.parse(rawUser);
      const nameEl = document.querySelector('.sidebar-user .user-name');
      const roleEl = document.querySelector('.sidebar-user .user-role');
      const avatarEl = document.querySelector('.sidebar-user .user-avatar');
      const isAdmin = user.rol === 'administrador' || user.rol === 'admin';
      
      const navItemAdmin = document.getElementById('navItemAdmin');
      if (navItemAdmin) {
        navItemAdmin.hidden = !isAdmin;
        const navLink = navItemAdmin.querySelector('a');
        if (navLink) {
          navLink.href = 'admin.html';
        }
      }

      if (nameEl && user.nombre) nameEl.textContent = user.nombre;
      if (roleEl) {
        if (isAdmin) {
          roleEl.textContent = '🛡️ Administrador General';
          roleEl.style.color = '#38bdf8';
          roleEl.style.fontWeight = '600';
        } else {
          roleEl.textContent = user.rol ? `Rol: ${user.rol}` : (user.correo || 'Usuario Registrado');
        }
      }
      if (avatarEl && user.nombre) {
        if (isAdmin) {
          avatarEl.style.background = 'linear-gradient(135deg, #0284c7, #38bdf8)';
          avatarEl.style.color = '#ffffff';
        }
        const parts = user.nombre.trim().split(/\s+/);
        const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]) : parts[0].substring(0, 2);
        avatarEl.textContent = initials.toUpperCase();
      }
    }
  } catch (_) {}
})();
