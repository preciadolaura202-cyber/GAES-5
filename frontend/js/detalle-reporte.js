/**
 * SegurIA — detalle-reporte.js
 * Muestra el detalle completo de un reporte leído desde ?id= en la URL.
 *
 * TODO (Backend):
 *  - getDemoReporteById(id) → GET /api/reportes/:id
 */
"use strict";

(function () {
  if (typeof window.SegurIAData === 'undefined') {
    console.error('[SegurIA] demo-data.js no cargado.');
    return;
  }

  const { getDemoReporteById, getDemoCategorias, MAPA_CENTRO } = window.SegurIAData;

  // Leer ID de la URL
  const params = new URLSearchParams(window.location.search);
  const id     = parseInt(params.get('id'), 10);

  const detailLayout = document.getElementById('detailLayout');
  const notFound     = document.getElementById('notFound');
  const infoCard     = document.getElementById('detailInfoCard');
  const pageTitle    = document.getElementById('detailPageTitle');

  if (!id || isNaN(id)) {
    showNotFound();
    return;
  }

  const reporte = getDemoReporteById(id);
  if (!reporte) {
    showNotFound();
    return;
  }

  // ── Rellenar la tarjeta de información ────────────────────────────────────
  const cats = getDemoCategorias();
  const cat  = cats.find(c => c.nombre === reporte.categoria);
  const color = cat ? cat.color : '#94A3B8';

  if (pageTitle) pageTitle.textContent = reporte.titulo;

  if (infoCard) {
    infoCard.innerHTML = `
      <div class="detail-cat-row">
        <span class="report-cat-badge" style="background:${color}22; border:1px solid ${color}55; color:${color};">
          ${cat?.icono || ''} ${reporte.categoria}
        </span>
        <span class="demo-tag" style="font-size:0.8rem;">· Reporte de demostración</span>
      </div>

      <h2 class="detail-title" id="detailTitle">${reporte.titulo}</h2>

      <p class="detail-desc">${reporte.descripcion}</p>

      <div class="detail-meta-grid">
        <div class="detail-meta-row">
          <span class="detail-meta-label">Categoría</span>
          <span class="detail-meta-val">${reporte.categoria}</span>
        </div>
        <div class="detail-meta-row">
          <span class="detail-meta-label">Ubicación</span>
          <span class="detail-meta-val">${reporte.ubicacion}</span>
        </div>
        <div class="detail-meta-row">
          <span class="detail-meta-label">Fecha</span>
          <span class="detail-meta-val">${reporte.fecha} — ${reporte.hora}</span>
        </div>
        ${reporte.lat ? `
        <div class="detail-meta-row">
          <span class="detail-meta-label">Coordenadas</span>
          <span class="detail-meta-val" style="font-family:var(--font-mono); font-size:0.8125rem;">
            ${reporte.lat.toFixed(5)}, ${reporte.lng.toFixed(5)}
          </span>
        </div>
        ` : ''}
      </div>

      <div class="detail-source-notice">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        <span>Fuente: Reporte comunitario ciudadano anónimo · La información no ha sido verificada.</span>
      </div>

      <div style="margin-top:18px; display:flex; gap:10px; flex-wrap:wrap;">
        <a href="reportes.html" class="btn-outline-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Volver a reportes
        </a>
        <a href="mapa.html" class="btn-accent-sm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon></svg>
          Ver en el mapa
        </a>
      </div>
    `;
  }

  // ── Mapa de detalle ───────────────────────────────────────────────────────
  const mapEl  = document.getElementById('detailMap');
  const mapFbEl = document.getElementById('detailMapFallback');

  if (mapEl && typeof L !== 'undefined' && reporte.lat) {
    try {
      if (mapFbEl) { mapFbEl.hidden = true; mapFbEl.style.display = 'none'; }
      const map = L.map('detailMap', {
        center: [reporte.lat, reporte.lng],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap · SegurIA demo',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.circleMarker([reporte.lat, reporte.lng], {
        radius: 13,
        fillColor: color,
        color: '#080D18',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map);

      marker.bindPopup(`<strong>${reporte.titulo}</strong><br><small>${reporte.categoria}</small>`).openPopup();

    } catch (err) {
      console.warn('[SegurIA] Error al inicializar mapa de detalle:', err);
      if (mapFbEl) mapFbEl.hidden = false;
    }
  } else if (mapEl && !reporte.lat) {
    // El reporte no tiene coordenadas
    if (mapFbEl) {
      mapFbEl.hidden = false;
      mapFbEl.querySelector('p').textContent = 'Este reporte no tiene coordenadas precisas.';
    }
  } else if (mapEl) {
    if (mapFbEl) mapFbEl.hidden = false;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function showNotFound() {
    if (detailLayout) detailLayout.hidden = true;
    if (notFound)     notFound.hidden = false;
  }
})();
