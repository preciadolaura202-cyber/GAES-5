/**
 * SegurIA — admin.js
 * Lógica exclusiva para la página de Administración (admin.html).
 * Trabaja exclusivamente con los datos reales de la base de datos MySQL (FastAPI backend).
 * Sin datos ficticios ni usuarios inventados.
 */
"use strict";

(function () {
  // ── Verificación de permisos de Administrador ─────────────────────────────
  const rawUser = sessionStorage.getItem('seguria_user') || sessionStorage.getItem('seguria_demo_user');
  let currentUser = null;
  try {
    currentUser = rawUser ? JSON.parse(rawUser) : null;
  } catch (_) {}

  const isAdmin = currentUser && (currentUser.rol === 'administrador' || currentUser.rol === 'admin');
  if (!isAdmin) {
    alert('Acceso restringido: Esta sección requiere rol de Administrador.');
    window.location.replace('dashboard.html');
    return;
  }

  // ── Configuración de API ──────────────────────────────────────────────────
  const API_BASE = window.SEGURIA_API_BASE || 'http://127.0.0.1:8000';

  let cachedUsers = [];
  let cachedReports = [];
  let cachedCats = [];
  let auditLogs = [
    { time: new Date().toLocaleTimeString(), text: `Sesión iniciada por ${currentUser.nombre || 'Administrador'}.` }
  ];

  function addAuditLog(text) {
    const time = new Date().toLocaleTimeString();
    auditLogs.unshift({ time, text });
    if (auditLogs.length > 10) auditLogs.pop();
    renderAuditLogs();
  }

  function renderAuditLogs() {
    const listEl = document.getElementById('adminAuditList');
    if (!listEl) return;
    listEl.innerHTML = auditLogs.map(log => `
      <li class="admin-audit-entry">
        <span class="audit-time">[${log.time}]</span>
        <span>${log.text}</span>
      </li>
    `).join('');
  }

  function updateDbStatus(isConnected, text) {
    const statusText = document.getElementById('adminDbStatusText');
    const badge = document.getElementById('adminDbStatus');
    if (statusText) statusText.textContent = text;
    if (badge) {
      if (isConnected) {
        badge.style.background = 'rgba(16, 185, 129, 0.12)';
        badge.style.borderColor = 'rgba(16, 185, 129, 0.35)';
        badge.style.color = '#34d399';
      } else {
        badge.style.background = 'rgba(239, 68, 68, 0.15)';
        badge.style.borderColor = 'rgba(239, 68, 68, 0.35)';
        badge.style.color = '#f87171';
      }
    }
  }

  function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  // ── Inicialización de Pestañas y Eventos ──────────────────────────────────
  function initAdminTabs() {
    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab);
      });
    });

    // Botón refrescar datos de MySQL
    document.getElementById('btnRefreshAdminData')?.addEventListener('click', () => {
      loadAllData(true);
    });

    // Buscador y filtros de usuarios en vivo
    document.getElementById('adminUserSearch')?.addEventListener('input', renderUsersTable);

    document.querySelectorAll('.admin-filter-btn').forEach(fBtn => {
      fBtn.addEventListener('click', () => {
        document.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
        fBtn.classList.add('active');
        renderUsersTable();
      });
    });

    // Buscador de reportes en vivo
    document.getElementById('adminReportSearch')?.addEventListener('input', renderReportsList);

    // Formulario de nueva categoría
    document.getElementById('adminNewCatForm')?.addEventListener('submit', handleCreateCategory);
  }

  function switchTab(tabKey) {
    const tabs = [
      { key: 'tabUsers', btnId: 'tabBtnUsers', paneId: 'paneUsers' },
      { key: 'tabReports', btnId: 'tabBtnReports', paneId: 'paneReports' },
      { key: 'tabCats', btnId: 'tabBtnCats', paneId: 'paneCats' },
      { key: 'tabAudit', btnId: 'tabBtnAudit', paneId: 'paneAudit' }
    ];

    tabs.forEach(t => {
      const btn = document.getElementById(t.btnId);
      const pane = document.getElementById(t.paneId);
      const isTarget = t.key === tabKey;

      if (btn) {
        btn.classList.toggle('active', isTarget);
        btn.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      }
      if (pane) {
        pane.hidden = !isTarget;
        pane.classList.toggle('active', isTarget);
      }
    });
  }

  // ── Carga de Datos Directos desde MySQL ───────────────────────────────────
  async function loadAllData(isManual = false) {
    if (isManual) {
      addAuditLog('Consulta manual a base de datos MySQL iniciada.');
    }

    await Promise.allSettled([
      loadUsersFromDatabase(),
      loadReportsFromDatabase(),
      loadCategoriesFromDatabase(),
      loadStatsFromDatabase()
    ]);

    renderAuditLogs();
  }

  // 1. Usuarios directamente desde MySQL
  async function loadUsersFromDatabase() {
    const tbody = document.getElementById('adminUsersList');
    if (!tbody) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/usuarios`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const users = await res.json();

      // Almacenar solo usuarios reales provenientes de la base de datos
      cachedUsers = Array.isArray(users) ? users : [];
      updateDbStatus(true, 'MySQL Conectado');

      const badgeUser = document.getElementById('badgeUserCount');
      if (badgeUser) badgeUser.textContent = cachedUsers.length;

      renderUsersTable();
    } catch (err) {
      updateDbStatus(false, 'MySQL Desconectado');
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:30px; color:#f87171;">
            ⚠️ No se pudo conectar con el servidor backend Python (${API_BASE}).<br>
            <span style="font-size:0.75rem; color:var(--text-muted); display:block; margin-top:6px;">
              Asegúrate de que MySQL esté activo en XAMPP/Laragon y ejecuta <code>iniciar-backend.bat</code>.
            </span>
          </td>
        </tr>
      `;
    }
  }

  function renderUsersTable() {
    const tbody = document.getElementById('adminUsersList');
    if (!tbody) return;

    const query = (document.getElementById('adminUserSearch')?.value || '').toLowerCase().trim();
    const activeFilterBtn = document.querySelector('.admin-filter-btn.active');
    const filterRole = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';

    const filtered = cachedUsers.filter(u => {
      const matchQ = (u.nombre || '').toLowerCase().includes(query) || (u.correo || '').toLowerCase().includes(query);
      const matchRole = filterRole === 'all' || u.rol === filterRole;
      return matchQ && matchRole;
    });

    if (!filtered.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:28px; color:var(--text-muted);">
            No hay usuarios registrados en MySQL que coincidan con los criterios.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(u => {
      const isAdm = u.rol === 'administrador';
      const roleBadge = isAdm
        ? `<span class="badge-role-admin">ADMINISTRADOR</span>`
        : `<span class="badge-role-user">${(u.rol || 'USUARIO').toUpperCase()}</span>`;

      const avatarInitials = (u.nombre || 'U').substring(0, 2).toUpperCase();

      const actionBtn = isAdm
        ? `<button type="button" class="btn-action-role btn-role-demote" onclick="window.SegurIAChangeRole(${u.id}, 'usuario')">Degradar a Usuario</button>`
        : `<button type="button" class="btn-action-role btn-role-promote" onclick="window.SegurIAChangeRole(${u.id}, 'administrador')">⭐ Promover a Administrador</button>`;

      const fechaFmt = u.fecha_registro ? u.fecha_registro.replace('T', ' ').substring(0, 16) : '—';

      return `
        <tr>
          <td><strong style="color:var(--text-muted); font-family:var(--font-mono);">#${u.id}</strong></td>
          <td>
            <div class="admin-user-cell">
              <div class="admin-user-avatar-sm ${isAdm ? 'is-admin' : ''}">${avatarInitials}</div>
              <div>
                <strong style="color:var(--text-primary); display:block;">${u.nombre}</strong>
              </div>
            </div>
          </td>
          <td><span style="font-family:var(--font-mono);">${u.correo}</span></td>
          <td>${roleBadge}</td>
          <td><span style="font-size:0.75rem; font-family:var(--font-mono);">${fechaFmt}</span></td>
          <td style="text-align: right;">
            ${actionBtn}
          </td>
        </tr>
      `;
    }).join('');
  }

  // 2. Reportes directamente desde MySQL
  async function loadReportsFromDatabase() {
    const listEl = document.getElementById('adminReportsList');
    if (!listEl) return;

    try {
      const res = await fetch(`${API_BASE}/api/reportes`);
      if (!res.ok) throw new Error();
      const reports = await res.json();
      cachedReports = Array.isArray(reports) ? reports : [];

      const badgeRep = document.getElementById('badgeReportCount');
      if (badgeRep) badgeRep.textContent = cachedReports.length;

      renderReportsList();
    } catch (_) {
      cachedReports = [];
      listEl.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:30px; color:var(--text-muted); background:rgba(15,23,42,0.4); border-radius:8px;">
          No se pudieron consultar los reportes de MySQL.
        </div>
      `;
    }
  }

  function renderReportsList() {
    const listEl = document.getElementById('adminReportsList');
    if (!listEl) return;

    const query = (document.getElementById('adminReportSearch')?.value || '').toLowerCase().trim();

    const filtered = cachedReports.filter(r => {
      return (r.titulo || '').toLowerCase().includes(query) || (r.categoria || '').toLowerCase().includes(query) || (r.descripcion || '').toLowerCase().includes(query);
    });

    if (!filtered.length) {
      listEl.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:32px; color:var(--text-muted); background:rgba(15,23,42,0.4); border-radius:8px;">
          No hay reportes registrados en la tabla 'resenas' de MySQL que coincidan con la búsqueda.
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(r => {
      const fecha = r.fecha ? r.fecha.replace('T', ' ').substring(0, 16) : 'Reciente';
      const autor = r.autor || 'Ciudadano';

      return `
        <article class="admin-report-card">
          <div>
            <div class="admin-report-top">
              <span style="font-size:0.7rem; font-weight:700; color:#38bdf8; font-family:var(--font-mono);">#${r.id}</span>
              <span class="report-cat-badge" style="background:rgba(56,189,248,0.12); border:1px solid rgba(56,189,248,0.3); color:#38bdf8; font-size:0.7rem;">
                ${r.categoria || 'Incidente'}
              </span>
            </div>
            <h4 class="admin-report-title">${r.titulo}</h4>
            <p class="admin-report-desc">${r.descripcion || ''}</p>
          </div>
          <div class="admin-report-footer">
            <span style="font-size:0.725rem; color:var(--text-muted);">${autor} · ${fecha}</span>
            <div style="display:flex; gap:6px;">
              <a href="detalle-reporte.html?id=${r.id}" class="btn-action-role" style="background:rgba(255,255,255,0.06); color:var(--text-secondary); text-decoration:none;" target="_blank">Ver</a>
              <button type="button" class="btn-delete-report" onclick="window.SegurIADeleteReport(${r.id})">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // 3. Categorías directamente desde MySQL
  async function loadCategoriesFromDatabase() {
    const listEl = document.getElementById('adminCatsList');
    if (!listEl) return;

    try {
      const res = await fetch(`${API_BASE}/api/categorias/`);
      if (!res.ok) throw new Error();
      const cats = await res.json();
      cachedCats = Array.isArray(cats) ? cats : [];

      const badgeCat = document.getElementById('badgeCatCount');
      if (badgeCat) badgeCat.textContent = cachedCats.length;

      renderCategoriesList();
    } catch (_) {
      cachedCats = [];
      listEl.innerHTML = `<span style="color:var(--text-muted); font-size:0.8rem;">No se pudieron consultar las categorías de MySQL.</span>`;
    }
  }

  function renderCategoriesList() {
    const listEl = document.getElementById('adminCatsList');
    if (!listEl) return;

    if (!cachedCats.length) {
      listEl.innerHTML = `<span style="color:var(--text-muted); font-size:0.8rem;">No hay categorías registradas en la tabla 'categorias'.</span>`;
      return;
    }

    listEl.innerHTML = cachedCats.map(c => `
      <div class="admin-cat-pill">
        <span style="font-weight:600;">${c.nombre}</span>
        <button type="button" class="btn-del-cat" title="Eliminar categoría #${c.id} de MySQL" onclick="window.SegurIADeleteCategory(${c.id}, '${c.nombre}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
    `).join('');
  }

  async function handleCreateCategory(e) {
    e.preventDefault();
    const nameInput = document.getElementById('adminCatName');
    const statusEl = document.getElementById('adminCatStatus');
    if (!nameInput || !nameInput.value.trim()) return;

    const nombre = nameInput.value.trim();

    try {
      const res = await fetch(`${API_BASE}/api/admin/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
      });
      const data = await res.json().catch(() => ({}));

      if (statusEl) {
        statusEl.style.display = 'block';
        if (res.ok) {
          statusEl.style.background = 'rgba(16,185,129,0.15)';
          statusEl.style.color = '#6ee7b7';
          statusEl.textContent = `✅ ${data.mensaje || 'Categoría guardada en la tabla MySQL'}`;
          nameInput.value = '';
          addAuditLog(`Categoría '${nombre}' insertada en MySQL.`);
          loadCategoriesFromDatabase();
          loadStatsFromDatabase();
        } else {
          statusEl.style.background = 'rgba(239,68,68,0.15)';
          statusEl.style.color = '#fca5a5';
          statusEl.textContent = `❌ ${data.detail || 'Error al guardar categoría en MySQL'}`;
        }
      }
    } catch (err) {
      if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.style.background = 'rgba(239,68,68,0.15)';
        statusEl.style.color = '#fca5a5';
        statusEl.textContent = '❌ Error al conectar con el servidor backend.';
      }
    }

    setTimeout(() => {
      if (statusEl) statusEl.style.display = 'none';
    }, 4500);
  }

  // 4. Métricas reales de MySQL
  async function loadStatsFromDatabase() {
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`);
      if (res.ok) {
        const stats = await res.json();
        setEl('metricTotalUsers', stats.total_usuarios);
        setEl('metricTotalAdmins', stats.total_admins);
        setEl('metricTotalReports', stats.total_reportes);
        setEl('metricTotalCats', stats.total_categorias);
      }
    } catch (_) {
      setEl('metricTotalUsers', cachedUsers.length || '—');
      setEl('metricTotalAdmins', cachedUsers.filter(u => u.rol === 'administrador').length || '—');
      setEl('metricTotalReports', cachedReports.length || '—');
      setEl('metricTotalCats', cachedCats.length || '—');
    }
  }

  // ── Funciones de Acción Globales ──────────────────────────────────────────

  // Cambiar rol de usuario en MySQL
  window.SegurIAChangeRole = async function (userId, newRole) {
    const userObj = cachedUsers.find(u => u.id === userId);
    const userName = userObj ? userObj.nombre : `Usuario #${userId}`;

    if (!confirm(`¿Confirmas cambiar el rol de '${userName}' a '${newRole.toUpperCase()}' en la base de datos MySQL?`)) {
      return;
    }

    const statusEl = document.getElementById('adminUserStatus');

    try {
      const res = await fetch(`${API_BASE}/api/admin/usuarios/${userId}/rol`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rol: newRole })
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.style.background = 'rgba(16,185,129,0.15)';
          statusEl.style.color = '#6ee7b7';
          statusEl.textContent = `✅ ${data.mensaje || 'Rol actualizado en la tabla usuarios de MySQL.'}`;
        }
        addAuditLog(`Rol de '${userName}' actualizado a '${newRole}' en MySQL.`);
        loadUsersFromDatabase();
        loadStatsFromDatabase();
      } else {
        alert('Error: ' + (data.detail || 'No se pudo actualizar el rol'));
      }
    } catch (err) {
      alert('Error de conexión con el backend Python.');
    }

    setTimeout(() => {
      if (statusEl) statusEl.style.display = 'none';
    }, 4500);
  };

  // Eliminar / Moderar reporte en MySQL
  window.SegurIADeleteReport = async function (reportId) {
    if (!confirm(`⚠️ ¿Eliminar permanentemente el reporte #${reportId} de la tabla 'resenas' en MySQL?`)) {
      return;
    }

    const statusEl = document.getElementById('adminReportStatus');

    try {
      const res = await fetch(`${API_BASE}/api/admin/reportes/${reportId}`, {
        method: 'DELETE'
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.style.background = 'rgba(16,185,129,0.15)';
          statusEl.style.color = '#6ee7b7';
          statusEl.textContent = `✅ ${data.mensaje || 'Reporte eliminado en MySQL con éxito.'}`;
        }
        addAuditLog(`Reporte #${reportId} eliminado de la base de datos.`);
        loadReportsFromDatabase();
        loadStatsFromDatabase();
      } else {
        alert('Error: ' + (data.detail || 'No se pudo eliminar el reporte'));
      }
    } catch (_) {
      alert('Error de conexión con el servidor.');
    }

    setTimeout(() => {
      if (statusEl) statusEl.style.display = 'none';
    }, 4500);
  };

  // Eliminar categoría en MySQL
  window.SegurIADeleteCategory = async function (catId, catName) {
    if (!confirm(`¿Eliminar la categoría '${catName}' de la tabla 'categorias' en MySQL?`)) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/categorias/${catId}`, {
        method: 'DELETE'
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        addAuditLog(`Categoría '${catName}' eliminada de MySQL.`);
        loadCategoriesFromDatabase();
        loadStatsFromDatabase();
      } else {
        alert('Error: ' + (data.detail || 'No se pudo eliminar la categoría'));
      }
    } catch (_) {
      alert('Error de conexión con el servidor.');
    }
  };

  // Inicialización
  initAdminTabs();
  loadAllData();
})();
