/**
 * SegurIA — dashboard.js
 * Lógica del panel principal: estadísticas, mapa de resumen y reportes recientes.
 *
 * TODO (Backend):
 *  - getDemoStats() → GET /api/estadisticas/resumen
 *  - getDemoReportes() → GET /api/reportes?limit=5
 *  - Mapa: sustituir DEMO_REPORTES por respuesta del servidor
 */
"use strict";

(function () {
  if (typeof window.SegurIAData === 'undefined') {
    console.error('[SegurIA] demo-data.js no cargado. El dashboard no puede inicializarse.');
    return;
  }

  const { getDemoStats, getDemoReportes, getDemoCategorias, MAPA_CENTRO } = window.SegurIAData;

  // ── Estadísticas ─────────────────────────────────────────────────────────
  const stats = getDemoStats();
  setEl('statTotal', stats.totalReportes);
  setEl('statHoy',   stats.reportesHoy);
  setEl('statZonas', stats.zonasMapeadas);
  setEl('statMes',   stats.reportesMes);

  // ── Leyenda de categorías ─────────────────────────────────────────────────
  const cats = getDemoCategorias();
  const legendEl = document.getElementById('legendItems');
  if (legendEl) {
    legendEl.innerHTML = cats.map(c => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${c.color}" aria-hidden="true"></span>
        <span>${c.nombre}</span>
      </div>
    `).join('');
  }

  // ── Mapa del dashboard ────────────────────────────────────────────────────
  const mapEl = document.getElementById('dashMap');
  let map = null;
  let userMarker = null;
  let userAccuracyCircle = null;

  if (mapEl && typeof L !== 'undefined') {
    try {
      map = L.map('dashMap', {
        center: [MAPA_CENTRO.lat, MAPA_CENTRO.lng],
        zoom: MAPA_CENTRO.zoom - 1,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · Datos de demostración',
        maxZoom: 19,
      }).addTo(map);

      // Agregar marcadores
      const reportes = getDemoReportes();
      reportes.forEach(r => {
        if (!r.lat || !r.lng) return;
        const cat = cats.find(c => c.nombre === r.categoria);
        const color = cat ? cat.color : '#94A3B8';
        const marker = L.circleMarker([r.lat, r.lng], {
          radius: 9,
          fillColor: color,
          color: '#1a1a2e',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: Archivo, sans-serif; font-size: 13px; max-width: 220px;">
            <div style="font-weight:700; margin-bottom:4px;">${r.titulo}</div>
            <div style="color:#94A3B8; margin-bottom:6px;">${r.categoria} · ${r.fecha}</div>
            <div style="line-height:1.4; color:#CBD5E1;">${r.descripcion.substring(0, 100)}…</div>
            <div style="margin-top:8px; font-size:11px; color:#FBBF24; font-style:italic;">⚠ Datos de demostración</div>
          </div>
        `, { className: 'seguria-popup' });
      });

    } catch (err) {
      console.warn('[SegurIA] Error al inicializar el mapa del dashboard:', err);
      showMapFallback('dashMap', 'mapFallback');
    }
  } else if (mapEl) {
    showMapFallback('dashMap', 'mapFallback');
  }

  // ── Geolocalización del Usuario ─────────────────────────────────────────
  const btnLocate      = document.getElementById('btnGeolocalizar');
  const geoCard        = document.getElementById('geoCard');
  const geoStatusDot   = document.getElementById('geoStatusDot');
  const geoStatusPill  = document.getElementById('geoStatusPill');
  const geoMessage     = document.getElementById('geoMessage');
  const geoDataGrid    = document.getElementById('geoDataGrid');
  const geoLat         = document.getElementById('geoLat');
  const geoLng         = document.getElementById('geoLng');
  const geoAccuracy    = document.getElementById('geoAccuracy');
  const geoStateText   = document.getElementById('geoStateText');
  const btnCloseGeo    = document.getElementById('btnCloseGeoCard');

  if (btnCloseGeo && geoCard) {
    btnCloseGeo.addEventListener('click', () => {
      geoCard.hidden = true;
    });
  }

  if (btnLocate) {
    btnLocate.addEventListener('click', () => {
      solicitarGeolocalizacion();
    });
  }

  function solicitarGeolocalizacion() {
    if (!navigator.geolocation) {
      mostrarErrorGeo('Tu navegador no soporta la API de geolocalización.');
      return;
    }

    if (!map) {
      mostrarErrorGeo('El mapa no está disponible en este momento.');
      return;
    }

    // Estado inicial: Solicitando / Pendiente
    if (geoCard) geoCard.hidden = false;
    if (btnLocate) btnLocate.classList.add('is-loading');

    actualizarEstadoVisual({
      dotClass: 'active',
      pillClass: 'pending',
      pillText: 'Localizando...',
      stateText: 'Solicitando coordenadas...',
      mostrarGrid: false,
      msgTipo: 'info',
      msgTexto: 'Solicitando acceso a tu ubicación... Por favor responde a la solicitud del navegador si aparece.'
    });

    const opciones = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      onGeoSuccess,
      onGeoError,
      opciones
    );
  }

  function onGeoSuccess(position) {
    if (btnLocate) btnLocate.classList.remove('is-loading');

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    // Centrar mapa de Leaflet
    map.setView([lat, lng], 15, { animate: true });

    // Crear icono personalizado distintivo para el usuario (azul cian pulsante)
    const userIcon = L.divIcon({
      className: 'custom-user-leaflet-icon',
      html: `
        <div class="user-location-marker" title="Tu ubicación actual">
          <div class="user-marker-pulse"></div>
          <div class="user-marker-core"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Actualizar o crear marcador
    if (userMarker) {
      userMarker.setLatLng([lat, lng]);
    } else {
      userMarker = L.marker([lat, lng], {
        icon: userIcon,
        zIndexOffset: 1000
      }).addTo(map);

      userMarker.bindPopup(`
        <div style="font-family: Archivo, sans-serif; font-size: 13px; max-width: 220px;">
          <div style="font-weight: 800; color: #38bdf8; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <span>📍 Tu ubicación actual</span>
          </div>
          <div style="color: #cbd5e1; font-size: 12px; margin-bottom: 4px;">
            Obtenida vía GPS / Red del navegador.
          </div>
          <div style="font-family: 'Chivo Mono', monospace; font-size: 11px; color: #94a3b8;">
            Precisión: ±${Math.round(accuracy)} metros
          </div>
        </div>
      `);
    }

    // Círculo de precisión
    if (userAccuracyCircle) {
      userAccuracyCircle.setLatLng([lat, lng]);
      userAccuracyCircle.setRadius(accuracy);
    } else {
      userAccuracyCircle = L.circle([lat, lng], {
        radius: accuracy,
        color: '#0284c7',
        fillColor: '#38bdf8',
        fillOpacity: 0.12,
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(map);
    }

    userMarker.openPopup();

    // Actualizar panel UI con al menos 6 decimales
    if (geoLat) geoLat.textContent = lat.toFixed(6);
    if (geoLng) geoLng.textContent = lng.toFixed(6);
    if (geoAccuracy) geoAccuracy.textContent = `± ${Math.round(accuracy)} m`;
    if (geoStateText) geoStateText.textContent = 'Ubicación activa';

    actualizarEstadoVisual({
      dotClass: 'success',
      pillClass: 'success',
      pillText: 'Ubicado',
      stateText: 'Ubicación confirmada',
      mostrarGrid: true,
      msgTipo: 'success',
      msgTexto: `Ubicación obtenida con éxito. Mapa centrado en tus coordenadas.`
    });
  }

  function onGeoError(error) {
    if (btnLocate) btnLocate.classList.remove('is-loading');

    let mensaje = '';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        mensaje = 'Permiso denegado: Has bloqueado el acceso a la ubicación en el navegador. Para activarlo, permite la ubicación en el candado o configuración del sitio.';
        break;
      case error.POSITION_UNAVAILABLE:
        mensaje = 'Ubicación no disponible: La señal de GPS o red no pudo determinar tus coordenadas actuales.';
        break;
      case error.TIMEOUT:
        mensaje = 'Tiempo de espera agotado: Se superó el límite de tiempo para obtener tu ubicación. Por favor, intenta de nuevo.';
        break;
      default:
        mensaje = `Error desconocido al obtener ubicación (${error.message || 'Sin detalles'}).`;
        break;
    }

    mostrarErrorGeo(mensaje);
  }

  function mostrarErrorGeo(msg) {
    actualizarEstadoVisual({
      dotClass: 'error',
      pillClass: 'error',
      pillText: 'Error',
      stateText: 'No disponible',
      mostrarGrid: false,
      msgTipo: 'error',
      msgTexto: msg
    });
  }

  function actualizarEstadoVisual(config) {
    if (geoStatusDot) {
      geoStatusDot.className = `geo-status-dot ${config.dotClass}`;
    }
    if (geoStatusPill) {
      geoStatusPill.className = `geo-status-pill ${config.pillClass}`;
      geoStatusPill.textContent = config.pillText;
    }
    if (geoStateText) {
      geoStateText.textContent = config.stateText;
    }
    if (geoMessage) {
      geoMessage.className = `geo-card-message ${config.msgTipo}`;
      geoMessage.textContent = config.msgTexto;
      geoMessage.hidden = false;
    }
    if (geoDataGrid) {
      geoDataGrid.hidden = !config.mostrarGrid;
    }
  }

  // ── Reportes recientes ────────────────────────────────────────────────────
  const recentList = document.getElementById('recentList');
  if (recentList) {
    const reportes = getDemoReportes().slice(0, 6);
    recentList.innerHTML = reportes.map(r => {
      const cat = cats.find(c => c.nombre === r.categoria);
      const color = cat ? cat.color : '#94A3B8';
      return `
        <li>
          <a class="recent-item" href="detalle-reporte.html?id=${r.id}" aria-label="Ver detalle: ${r.titulo}">
            <div class="recent-item-title">${r.titulo}</div>
            <div class="recent-item-meta">
              <span class="report-cat-badge" style="background:${color}22; border:1px solid ${color}55; color:${color};">
                ${r.categoria}
              </span>
              <span style="font-size:0.75rem; color:var(--text-muted);">${r.fecha}</span>
            </div>
          </a>
        </li>
      `;
    }).join('');
  }

  // ── Búsqueda de zonas (demo) ──────────────────────────────────────────────
  const zoneSearch    = document.getElementById('zoneSearch');
  const suggestions   = document.getElementById('searchSuggestions');
  const DEMO_ZONAS    = ['Chapinero', 'Teusaquillo', 'La Candelaria', 'Zona Rosa', 'Usaquén', 'Kennedy', 'Suba', 'Engativá'];

  if (zoneSearch && suggestions) {
    zoneSearch.addEventListener('input', () => {
      const q = zoneSearch.value.trim().toLowerCase();
      if (!q) { suggestions.hidden = true; return; }
      const matches = DEMO_ZONAS.filter(z => z.toLowerCase().includes(q));
      if (!matches.length) { suggestions.hidden = true; return; }
      suggestions.innerHTML = matches.map(z =>
        `<button class="search-suggestion-item" type="button">${z}</button>`
      ).join('');
      suggestions.hidden = false;
    });

    suggestions.addEventListener('click', (e) => {
      const btn = e.target.closest('.search-suggestion-item');
      if (btn) {
        zoneSearch.value = btn.textContent;
        suggestions.hidden = true;
      }
    });

    document.addEventListener('click', (e) => {
      if (!zoneSearch.contains(e.target) && !suggestions.contains(e.target)) {
        suggestions.hidden = true;
      }
    });
  }

  // ── Utilidades ───────────────────────────────────────────────────────────
  function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function showMapFallback(mapId, fallbackId) {
    const mapEl = document.getElementById(mapId);
    const fbEl  = document.getElementById(fallbackId);
    if (mapEl) mapEl.style.background = 'var(--bg-surface)';
    if (fbEl)  fbEl.hidden = false;
  }
  // ── Detección de Rol Administrador para acceso a la página admin.html ──
  try {
    const rawUser = sessionStorage.getItem('seguria_user') || sessionStorage.getItem('seguria_demo_user');
    const user = rawUser ? JSON.parse(rawUser) : null;
    const isAdmin = user && (user.rol === 'administrador' || user.rol === 'admin');

    if (isAdmin) {
      const headerBtn = document.getElementById('btnAdminHeaderShortcut');
      if (headerBtn) headerBtn.hidden = false;

      const sub = document.querySelector('.page-subtitle');
      if (sub) {
        sub.innerHTML = `Bienvenido, <strong>${user.nombre || 'Administrador'}</strong> · <span style="color:#38bdf8; font-weight:700;">Sesión de Administrador</span>`;
      }
    }
  } catch (_) {}
})();


