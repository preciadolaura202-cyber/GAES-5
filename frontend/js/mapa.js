/**
 * SegurIA — mapa.js
 * Página de mapa interactivo con integración de Inteligencia Artificial Geoespacial,
 * zonas de riesgo clasificadas, mapa de calor Leaflet.heat y geolocalización GPS.
 *
 * Backend IA: /api/ia/zonas-riesgo, /api/ia/mapa-calor, /api/ia/incidentes
 */
"use strict";

(function () {
  if (typeof window.SegurIAData === 'undefined') {
    console.error('[SegurIA] demo-data.js no cargado.');
    return;
  }

  const { getDemoReportes, getDemoCategorias, MAPA_CENTRO } = window.SegurIAData;

  const cats = getDemoCategorias();
  const reportes = getDemoReportes();

  const API_BASE_URL = 'http://127.0.0.1:8000';

  let map = null;
  let allMarkers = []; // [{ reporteId, marker, categoriaId }]
  let activeCat = 'all';
  let activeLayerMode = 'marcadores'; // 'marcadores' | 'zonas' | 'calor'

  // Capas de Leaflet
  let layerIncidentes = null;
  let layerZonasIA = null;
  let layerHeatmap = null;

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

  // ── Selector de Modo de Capa IA (Marcadores / Zonas / Calor) ─────────────
  const layerSelector = document.getElementById('layerSelector');
  if (layerSelector) {
    layerSelector.addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-filter-btn');
      if (!btn || !btn.dataset.layer) return;
      activeLayerMode = btn.dataset.layer;
      layerSelector.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.toggle('active', b === btn));
      switchLayerMode(activeLayerMode);
    });
  }

  function switchLayerMode(mode) {
    if (!map) return;

    // Gestionar visibilidad de capa de incidentes individuales
    if (layerIncidentes) {
      if (mode === 'marcadores') {
        if (!map.hasLayer(layerIncidentes)) map.addLayer(layerIncidentes);
      } else {
        if (map.hasLayer(layerIncidentes)) map.removeLayer(layerIncidentes);
      }
    }

    // Gestionar visibilidad de capa de Zonas de Riesgo IA
    if (layerZonasIA) {
      if (mode === 'zonas') {
        if (!map.hasLayer(layerZonasIA)) map.addLayer(layerZonasIA);
      } else {
        if (map.hasLayer(layerZonasIA)) map.removeLayer(layerZonasIA);
      }
    }

    // Gestionar visibilidad de Mapa de Calor
    if (layerHeatmap) {
      if (mode === 'calor') {
        if (!map.hasLayer(layerHeatmap)) map.addLayer(layerHeatmap);
      } else {
        if (map.hasLayer(layerHeatmap)) map.removeLayer(layerHeatmap);
      }
    }
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
      const fbInit = document.getElementById('mapFallback');
      if (fbInit) {
        fbInit.hidden = true;
        fbInit.style.display = 'none';
      }
      map = L.map('fullMap', {
        center: [MAPA_CENTRO.lat, MAPA_CENTRO.lng],
        zoom: MAPA_CENTRO.zoom,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">HOT</a> · SegurIA GAES-5',
        maxZoom: 19,
      }).addTo(map);

      // Crear grupos de capas
      layerIncidentes = L.layerGroup().addTo(map);
      layerZonasIA = L.layerGroup();

      // Renderizar incidentes individuales iniciales
      renderIndividualMarkers(reportes);

      // Cargar datos del agente de Inteligencia Artificial
      cargarDatosAgenteIA();

    } catch (err) {
      console.warn('[SegurIA] Error al inicializar mapa completo:', err);
      const fb = document.getElementById('mapFallback');
      if (fb) { fb.hidden = false; fb.style.display = 'flex'; }
    }
  } else if (mapEl) {
    const fb = document.getElementById('mapFallback');
    if (fb) { fb.hidden = false; fb.style.display = 'flex'; }
  }

  function renderIndividualMarkers(listaReportes) {
    if (!layerIncidentes) return;
    layerIncidentes.clearLayers();
    allMarkers = [];

    listaReportes.forEach(r => {
      if (!r.lat || !r.lng) return;
      const cat = cats.find(c => c.nombre.toLowerCase() === (r.categoria || '').toLowerCase());
      const color = cat ? cat.color : '#94A3B8';

      const marker = L.circleMarker([r.lat, r.lng], {
        radius: 11,
        fillColor: color,
        color: '#080D18',
        weight: 2.5,
        opacity: 1,
        fillOpacity: 0.88,
      });

      marker.on('click', () => showMarkerDetail(r));
      layerIncidentes.addLayer(marker);

      allMarkers.push({
        reporteId: r.id,
        marker,
        categoriaId: r.categoriaId || (cat ? cat.id : 5),
      });
    });
  }

  // ── Cargar Zonas de Riesgo y Heatmap desde la API de Inteligencia Artificial ──
  async function cargarDatosAgenteIA() {
    try {
      // 1. Cargar Zonas de Riesgo clasificadas por la IA
      const resZonas = await fetch(`${API_BASE_URL}/api/ia/zonas-riesgo`);
      if (resZonas.ok) {
        const zonas = await resZonas.json();
        renderZonasRiesgoIA(zonas);
      }

      // 2. Cargar puntos de Mapa de Calor
      const resHeat = await fetch(`${API_BASE_URL}/api/ia/mapa-calor?max_puntos=3000`);
      if (resHeat.ok && typeof L.heatLayer === 'function') {
        const heatData = await resHeat.json();
        if (heatData && heatData.puntos && heatData.puntos.length > 0) {
          layerHeatmap = L.heatLayer(heatData.puntos, {
            radius: heatData.configuracion_recomendada?.radius || 24,
            blur: heatData.configuracion_recomendada?.blur || 16,
            maxZoom: 17,
            max: 1.0,
            gradient: heatData.configuracion_recomendada?.gradient || {
              0.2: '#00ffcc',
              0.4: '#22c55e',
              0.6: '#eab308',
              0.8: '#f97316',
              1.0: '#ef4444'
            }
          });
        }
      }
    } catch (err) {
      console.info('[SegurIA IA] Backend IA en modo local o fuera de línea. Manteniendo datos activos:', err);
    }
  }

  function renderZonasRiesgoIA(zonas) {
    if (!layerZonasIA || !Array.isArray(zonas)) return;
    layerZonasIA.clearLayers();

    zonas.forEach(z => {
      const lat = z.centro.latitud;
      const lng = z.centro.longitud;
      const radio = Math.max(300, Math.min(z.radio_metros || 400, 1500));
      const color = z.color_hex || '#EF4444';

      // Círculo de cobertura de zona de riesgo
      const circle = L.circle([lat, lng], {
        radius: radio,
        color: color,
        fillColor: color,
        fillOpacity: 0.22,
        weight: 2,
        dashArray: z.nivel_riesgo === 'Alto' ? '4, 4' : undefined
      });

      // Marcador central táctico de zona
      const badgeIcon = L.divIcon({
        className: 'custom-risk-icon',
        html: `
          <div style="background:${color}; color:#fff; font-family:Archivo,sans-serif; font-weight:800; font-size:11px; padding:3px 7px; border-radius:12px; border:2px solid #080D18; white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,0.5);">
            🛡 ${z.nivel_riesgo} (${z.puntuacion} pts)
          </div>
        `,
        iconAnchor: [45, 12]
      });

      const badgeMarker = L.marker([lat, lng], { icon: badgeIcon });

      const popupHtml = `
        <div style="font-family: Archivo, sans-serif; font-size: 13px; max-width: 260px; line-height: 1.4;">
          <div style="font-weight: 800; color: ${color}; font-size: 14px; margin-bottom: 4px;">
            🛡 ${z.sector_nombre}
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            Comuna: <strong>${z.comuna || 'Urbana'}</strong>
          </div>
          <div style="background: rgba(255,255,255,0.06); padding: 8px; border-radius: 6px; margin-bottom: 8px;">
            <div><strong>Nivel de riesgo estimado:</strong> <span style="color:${color}; font-weight:bold;">${z.nivel_riesgo}</span></div>
            <div><strong>Puntuación estadística:</strong> ${z.puntuacion} / 100</div>
            <div><strong>Incidentes registrados:</strong> ${z.cantidad_incidentes.toLocaleString()}</div>
            <div><strong>Delito predominante:</strong> ${z.categoria_predominante}</div>
          </div>
          <div style="font-size: 10px; color: #64748b; font-style: italic;">
            ${z.advertencia || 'Basado en densidad histórica de reportes.'}
          </div>
        </div>
      `;

      circle.bindPopup(popupHtml);
      badgeMarker.bindPopup(popupHtml);

      layerZonasIA.addLayer(circle);
      layerZonasIA.addLayer(badgeMarker);
    });
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
  const markerCat = document.getElementById('markerCat');
  const markerDesc = document.getElementById('markerDesc');
  const markerUbic = document.getElementById('markerUbicacion');
  const markerFecha = document.getElementById('markerFecha');
  const markerLink = document.getElementById('markerVerDetalle');
  const detailClose = document.getElementById('markerDetailClose');

  function showMarkerDetail(r) {
    if (!detailPanel) return;
    const cat = cats.find(c => c.nombre.toLowerCase() === (r.categoria || '').toLowerCase());
    const color = cat ? cat.color : '#94A3B8';

    if (markerCat) {
      markerCat.textContent = r.categoria;
      markerCat.style.background = `${color}22`;
      markerCat.style.borderColor = `${color}55`;
      markerCat.style.color = color;
    }
    if (markerTitle) markerTitle.textContent = r.titulo || r.conducta_detalle || 'Reporte de Incidente';
    if (markerDesc) markerDesc.textContent = r.descripcion || `Incidente clasificado en ${r.categoria} reportado en sector ${r.barrio || 'urbano'}.`;
    if (markerUbic) markerUbic.textContent = `📍 ${r.ubicacion || (r.barrio ? r.barrio + ', ' + r.comuna : 'Bucaramanga')}`;
    if (markerFecha) markerFecha.textContent = `📅 ${r.fecha ? r.fecha + ' ' + (r.hora || '') : r.ano + '/' + r.mes + '/' + r.dia}`;
    if (markerLink) markerLink.href = `detalle-reporte.html?id=${r.id || r.id_origen || 1}`;

    detailPanel.hidden = false;
  }

  if (detailClose) {
    detailClose.addEventListener('click', () => {
      detailPanel.hidden = true;
    });
  }

  // ── Geolocalización del Usuario en Mapa Completo ─────────────────────────
  const btnLocateMapa = document.getElementById('btnGeolocalizarMapa');
  const geoCardMapa = document.getElementById('geoCardMapa');
  const geoStatusDotMapa = document.getElementById('geoStatusDotMapa');
  const geoStatusPillMapa = document.getElementById('geoStatusPillMapa');
  const geoMessageMapa = document.getElementById('geoMessageMapa');
  const geoDataGridMapa = document.getElementById('geoDataGridMapa');
  const geoLatMapa = document.getElementById('geoLatMapa');
  const geoLngMapa = document.getElementById('geoLngMapa');
  const geoAccuracyMapa = document.getElementById('geoAccuracyMapa');
  const geoStateTextMapa = document.getElementById('geoStateTextMapa');
  const btnCloseGeoMapa = document.getElementById('btnCloseGeoCardMapa');

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
