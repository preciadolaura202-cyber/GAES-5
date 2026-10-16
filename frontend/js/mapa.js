/**
 * SegurIA — mapa.js
 * Página de mapa interactivo completo con filtros por categoría.
 *
 * TODO (Backend):
 *  - getDemoReportes() → GET /api/reportes (todos, con paginación)
 *  - getDemoCategorias() → GET /api/categorias
 */
"use strict";

(function () {
  if (typeof window.SegurIAData === 'undefined') {
    console.error('[SegurIA] demo-data.js no cargado.');
    return;
  }

  const { getDemoReportes, getDemoCategorias, MAPA_CENTRO } = window.SegurIAData;

  const cats    = getDemoCategorias();
  const reportes = getDemoReportes();

  let map = null;
  let allMarkers = []; // [{ reporteId, marker, categoriaId }]
  let activeCat  = 'all';

  // ── Construir filtros de categoría ────────────────────────────────────────
  const filterRow = document.getElementById('catFilters');
  if (filterRow) {
    cats.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'cat-filter-btn';
      btn.dataset.cat = String(cat.id);
      btn.textContent = cat.nombre;
      filterRow.appendChild(btn);
    });

    filterRow.addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-filter-btn');
      if (!btn) return;
      activeCat = btn.dataset.cat;
      filterRow.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
      applyFilter();
    });
  }

  // ── Construir leyenda flotante ────────────────────────────────────────────
  const legendList = document.getElementById('legendFloatList');
  if (legendList) {
    legendList.innerHTML = cats.map(c => `
      <li>
        <span class="legend-dot" style="background:${c.color}; width:10px; height:10px; border-radius:50%; display:inline-block;" aria-hidden="true"></span>
        ${c.nombre}
      </li>
    `).join('');
  }

  // ── Inicializar mapa Leaflet ──────────────────────────────────────────────
  const mapEl = document.getElementById('fullMap');

  if (mapEl && typeof L !== 'undefined') {
    try {
      map = L.map('fullMap', {
        center: [MAPA_CENTRO.lat, MAPA_CENTRO.lng],
        zoom: MAPA_CENTRO.zoom,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · Datos de demostración · SegurIA GAES-5',
        maxZoom: 19,
      }).addTo(map);

      // Crear marcadores
      reportes.forEach(r => {
        if (!r.lat || !r.lng) return;
        const cat = cats.find(c => c.nombre === r.categoria);
        const color = cat ? cat.color : '#94A3B8';

        const marker = L.circleMarker([r.lat, r.lng], {
          radius: 11,
          fillColor: color,
          color: '#080D18',
          weight: 2.5,
          opacity: 1,
          fillOpacity: 0.88,
        }).addTo(map);

        marker.on('click', () => showMarkerDetail(r));

        allMarkers.push({
          reporteId: r.id,
          marker,
          categoriaId: r.categoriaId,
        });
      });

    } catch (err) {
      console.warn('[SegurIA] Error al inicializar mapa completo:', err);
      document.getElementById('mapFallback').hidden = false;
    }
  } else if (mapEl) {
    document.getElementById('mapFallback').hidden = false;
  }

  // ── Filtrar marcadores ────────────────────────────────────────────────────
  function applyFilter() {
    allMarkers.forEach(({ marker, categoriaId }) => {
      const visible = activeCat === 'all' || String(categoriaId) === activeCat;
      if (visible) {
        marker.setStyle({ fillOpacity: 0.88, opacity: 1 });
        marker.getElement && marker.getElement()?.style.setProperty('pointer-events', 'auto');
      } else {
        marker.setStyle({ fillOpacity: 0.1, opacity: 0.2 });
      }
    });
  }

  // ── Panel de detalle de marcador ──────────────────────────────────────────
  const detailPanel = document.getElementById('markerDetailPanel');
  const markerTitle = document.getElementById('markerTitle');
  const markerCat   = document.getElementById('markerCat');
  const markerDesc  = document.getElementById('markerDesc');
  const markerUbic  = document.getElementById('markerUbicacion');
  const markerFecha = document.getElementById('markerFecha');
  const markerLink  = document.getElementById('markerVerDetalle');
  const detailClose = document.getElementById('markerDetailClose');

  function showMarkerDetail(r) {
    if (!detailPanel) return;
    const cat = cats.find(c => c.nombre === r.categoria);
    const color = cat ? cat.color : '#94A3B8';

    if (markerCat) {
      markerCat.textContent = r.categoria;
      markerCat.style.background = `${color}22`;
      markerCat.style.borderColor = `${color}55`;
      markerCat.style.color = color;
    }
    if (markerTitle)  markerTitle.textContent  = r.titulo;
    if (markerDesc)   markerDesc.textContent   = r.descripcion;
    if (markerUbic)   markerUbic.textContent   = `📍 ${r.ubicacion}`;
    if (markerFecha)  markerFecha.textContent  = `📅 ${r.fecha} ${r.hora}`;
    if (markerLink)   markerLink.href          = `detalle-reporte.html?id=${r.id}`;

    detailPanel.hidden = false;
  }

  if (detailClose) {
    detailClose.addEventListener('click', () => {
      detailPanel.hidden = true;
    });
  }

})();
