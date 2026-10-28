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
  let userMarker = null;
  let userAccuracyCircle = null;

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

  // ── Geolocalización del Usuario en Mapa Completo ─────────────────────────
  const btnLocateMapa     = document.getElementById('btnGeolocalizarMapa');
  const geoCardMapa       = document.getElementById('geoCardMapa');
  const geoStatusDotMapa  = document.getElementById('geoStatusDotMapa');
  const geoStatusPillMapa = document.getElementById('geoStatusPillMapa');
  const geoMessageMapa    = document.getElementById('geoMessageMapa');
  const geoDataGridMapa   = document.getElementById('geoDataGridMapa');
  const geoLatMapa        = document.getElementById('geoLatMapa');
  const geoLngMapa        = document.getElementById('geoLngMapa');
  const geoAccuracyMapa   = document.getElementById('geoAccuracyMapa');
  const geoStateTextMapa  = document.getElementById('geoStateTextMapa');
  const btnCloseGeoMapa   = document.getElementById('btnCloseGeoCardMapa');

  if (btnCloseGeoMapa && geoCardMapa) {
    btnCloseGeoMapa.addEventListener('click', () => {
      geoCardMapa.hidden = true;
    });
  }

  if (btnLocateMapa) {
    btnLocateMapa.addEventListener('click', () => {
      solicitarGeolocalizacionMapa();
    });
  }

  function solicitarGeolocalizacionMapa() {
    if (!navigator.geolocation) {
      mostrarErrorGeoMapa('Tu navegador no soporta la API de geolocalización.');
      return;
    }

    if (!map) {
      mostrarErrorGeoMapa('El mapa no está disponible en este momento.');
      return;
    }

    if (geoCardMapa) geoCardMapa.hidden = false;
    if (btnLocateMapa) btnLocateMapa.classList.add('is-loading');

    actualizarEstadoVisualMapa({
      dotClass: 'active',
      pillClass: 'pending',
      pillText: 'Localizando...',
      stateText: 'Solicitando coordenadas...',
      mostrarGrid: false,
      msgTipo: 'info',
      msgTexto: 'Solicitando acceso a tu ubicación... Responde al permiso del navegador si aparece.'
    });

    const opciones = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      onGeoSuccessMapa,
      onGeoErrorMapa,
      opciones
    );
  }

  function onGeoSuccessMapa(position) {
    if (btnLocateMapa) btnLocateMapa.classList.remove('is-loading');

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    map.setView([lat, lng], 16, { animate: true });

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

    if (userMarker) {
      userMarker.setLatLng([lat, lng]);
    } else {
      userMarker = L.marker([lat, lng], {
        icon: userIcon,
        zIndexOffset: 1000
      }).addTo(map);

      userMarker.bindPopup(`
        <div style="font-family: Archivo, sans-serif; font-size: 13px; max-width: 220px;">
          <div style="font-weight: 800; color: #38bdf8; margin-bottom: 4px;">📍 Tu ubicación actual</div>
          <div style="color: #cbd5e1; font-size: 12px; margin-bottom: 4px;">Obtenida vía GPS / Red.</div>
          <div style="font-family: 'Chivo Mono', monospace; font-size: 11px; color: #94a3b8;">
            Precisión: ±${Math.round(accuracy)} m
          </div>
        </div>
      `);
    }

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

    if (geoLatMapa) geoLatMapa.textContent = lat.toFixed(6);
    if (geoLngMapa) geoLngMapa.textContent = lng.toFixed(6);
    if (geoAccuracyMapa) geoAccuracyMapa.textContent = `± ${Math.round(accuracy)} m`;
    if (geoStateTextMapa) geoStateTextMapa.textContent = 'Ubicación activa';

    actualizarEstadoVisualMapa({
      dotClass: 'success',
      pillClass: 'success',
      pillText: 'Ubicado',
      stateText: 'Ubicación confirmada',
      mostrarGrid: true,
      msgTipo: 'success',
      msgTexto: `Ubicación obtenida con éxito. Mapa centrado.`
    });
  }

  function onGeoErrorMapa(error) {
    if (btnLocateMapa) btnLocateMapa.classList.remove('is-loading');

    let mensaje = '';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        mensaje = 'Permiso denegado: Has bloqueado el acceso a la ubicación. Para activarlo, concede el permiso en la barra del navegador.';
        break;
      case error.POSITION_UNAVAILABLE:
        mensaje = 'Ubicación no disponible: La señal no pudo determinar tus coordenadas actuales.';
        break;
      case error.TIMEOUT:
        mensaje = 'Tiempo de espera agotado al intentar obtener tu ubicación.';
        break;
      default:
        mensaje = `Error al obtener ubicación (${error.message || 'Desconocido'}).`;
        break;
    }

    mostrarErrorGeoMapa(mensaje);
  }

  function mostrarErrorGeoMapa(msg) {
    actualizarEstadoVisualMapa({
      dotClass: 'error',
      pillClass: 'error',
      pillText: 'Error',
      stateText: 'No disponible',
      mostrarGrid: false,
      msgTipo: 'error',
      msgTexto: msg
    });
  }

  function actualizarEstadoVisualMapa(config) {
    if (geoStatusDotMapa) {
      geoStatusDotMapa.className = `geo-status-dot ${config.dotClass}`;
    }
    if (geoStatusPillMapa) {
      geoStatusPillMapa.className = `geo-status-pill ${config.pillClass}`;
      geoStatusPillMapa.textContent = config.pillText;
    }
    if (geoStateTextMapa) {
      geoStateTextMapa.textContent = config.stateText;
    }
    if (geoMessageMapa) {
      geoMessageMapa.className = `geo-card-message ${config.msgTipo}`;
      geoMessageMapa.textContent = config.msgTexto;
      geoMessageMapa.hidden = false;
    }
    if (geoDataGridMapa) {
      geoDataGridMapa.hidden = !config.mostrarGrid;
    }
  }

})();
