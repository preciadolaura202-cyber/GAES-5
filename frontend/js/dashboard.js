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
  if (mapEl && typeof L !== 'undefined') {
    try {
      const map = L.map('dashMap', {
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
})();
