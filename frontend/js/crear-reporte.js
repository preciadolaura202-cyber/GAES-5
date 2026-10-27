/**
 * SegurIA — crear-reporte.js
 * Formulario de creación de reporte con validación y mini-mapa Leaflet.
 *
 * TODO (Backend):
 *  - publicarReporte() → POST /api/reportes con el payload del formulario
 *  - Categorías → GET /api/categorias en lugar de leer de demo-data.js
 */
"use strict";

(function () {
  if (typeof window.SegurIAData === 'undefined') {
    console.error('[SegurIA] demo-data.js no cargado.');
    return;
  }

  const { getDemoCategorias, agregarReporteLocal, MAPA_CENTRO } = window.SegurIAData;

  const form          = document.getElementById('createReportForm');
  const banner        = document.getElementById('reportBanner');
  const submitBtn     = document.getElementById('reportSubmitBtn');
  const confirmModal  = document.getElementById('confirmModal');

  // Campos
  const tituloInput   = document.getElementById('repTitulo');
  const descInput     = document.getElementById('repDesc');
  const ubicInput     = document.getElementById('repUbicacion');
  const latInput      = document.getElementById('repLat');
  const lngInput      = document.getElementById('repLng');
  const descCount     = document.getElementById('repDescCount');
  const coordText     = document.getElementById('coordText');
  const coordDisplay  = document.getElementById('coordDisplay');
  const coordStatus   = document.getElementById('coordStatus');

  let selectedCat = null; // id de categoría seleccionada
  let selectedMarker = null;
  let miniMap = null;

  // ── Selector de categorías ────────────────────────────────────────────────
  const cats = getDemoCategorias();
  const catGrid = document.getElementById('catSelectorGrid');

  if (catGrid) {
    catGrid.innerHTML = cats.map(cat => `
      <button type="button"
        class="cat-selector-btn"
        data-cat-id="${cat.id}"
        data-cat-name="${cat.nombre}"
        aria-pressed="false"
        style="border-color: ${cat.color}33;"
      >
        <span class="cat-selector-icon" aria-hidden="true">${cat.icono}</span>
        ${cat.nombre}
      </button>
    `).join('');

    catGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-selector-btn');
      if (!btn) return;
      selectedCat = { id: Number(btn.dataset.catId), nombre: btn.dataset.catName };

      catGrid.querySelectorAll('.cat-selector-btn').forEach(b => {
        const isSelected = b === btn;
        const cat = cats.find(c => c.id === Number(b.dataset.catId));
        b.classList.toggle('selected', isSelected);
        b.setAttribute('aria-pressed', String(isSelected));
        if (cat) {
          b.style.borderColor = isSelected ? cat.color : `${cat.color}33`;
          b.style.background  = isSelected ? `${cat.color}18` : '';
          b.style.color       = isSelected ? cat.color : '';
        }
      });

      clearCatError();
    });
  }

  // ── Contador de caracteres de descripción ─────────────────────────────────
  if (descInput && descCount) {
    descInput.addEventListener('input', () => {
      descCount.textContent = `${descInput.value.length}/500`;
    });
  }

  // ── Mini mapa Leaflet ─────────────────────────────────────────────────────
  const mapEl = document.getElementById('createMap');
  const selectMapBtn = document.getElementById('selectMapBtn');

  if (mapEl && typeof L !== 'undefined') {
    try {
      miniMap = L.map('createMap', {
        center: [MAPA_CENTRO.lat, MAPA_CENTRO.lng],
        zoom: MAPA_CENTRO.zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap · SegurIA demo',
        maxZoom: 19,
      }).addTo(miniMap);

      miniMap.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setCoords(lat, lng);
        if (selectedMarker) {
          selectedMarker.setLatLng([lat, lng]);
        } else {
          selectedMarker = L.marker([lat, lng]).addTo(miniMap);
        }
      });

    } catch (err) {
      console.warn('[SegurIA] Error al inicializar mini-mapa:', err);
      document.getElementById('createMapFallback').hidden = false;
    }
  } else if (mapEl) {
    document.getElementById('createMapFallback').hidden = false;
  }

  // Botón "Seleccionar ubicación en el mapa"
  if (selectMapBtn && miniMap) {
    selectMapBtn.addEventListener('click', () => {
      // Hacer scroll suave al mapa
      mapEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      showBanner('info', 'Haz clic en el mapa para marcar la ubicación del incidente.');
    });
  }

  function setCoords(lat, lng) {
    latInput.value = lat.toFixed(6);
    lngInput.value = lng.toFixed(6);

    const txt = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
    if (coordText)    coordText.textContent  = txt;
    if (coordDisplay) coordDisplay.classList.add('has-coords');
    if (coordStatus)  coordStatus.textContent = 'Coordenadas seleccionadas';
  }

  // ── Validación ────────────────────────────────────────────────────────────
  function validateTitulo() {
    const val = tituloInput.value.trim();
    const wrap = document.getElementById('repTituloWrap');
    const err  = document.getElementById('repTituloErr');
    if (!val) return setFieldError(tituloInput, wrap, err, 'El título es requerido.');
    if (val.length < 5) return setFieldError(tituloInput, wrap, err, 'Mínimo 5 caracteres.');
    return clearFieldError(tituloInput, wrap, err);
  }

  function validateDesc() {
    const val = descInput.value.trim();
    const err  = document.getElementById('repDescErr');
    const pseudoWrap = descInput.parentElement;
    if (!val) return setFieldError(descInput, pseudoWrap, err, 'La descripción es requerida.', true);
    if (val.length < 10) return setFieldError(descInput, pseudoWrap, err, 'Mínimo 10 caracteres.', true);
    return clearFieldError(descInput, pseudoWrap, err, true);
  }

  function validateUbicacion() {
    const val = ubicInput.value.trim();
    const wrap = document.getElementById('repUbicacionWrap');
    const err  = document.getElementById('repUbicacionErr');
    if (!val) return setFieldError(ubicInput, wrap, err, 'La ubicación es requerida.');
    if (val.length < 5) return setFieldError(ubicInput, wrap, err, 'Describe mejor la ubicación.');
    return clearFieldError(ubicInput, wrap, err);
  }

  function validateCat() {
    const err = document.getElementById('repCatErr');
    if (!selectedCat) {
      if (err) { err.textContent = 'Selecciona una categoría.'; err.hidden = false; }
      return false;
    }
    clearCatError();
    return true;
  }

  function clearCatError() {
    const err = document.getElementById('repCatErr');
    if (err) err.hidden = true;
  }

  function setFieldError(input, wrap, errEl, msg, isTextarea = false) {
    if (!isTextarea && wrap) wrap.classList.add('has-error');
    else if (isTextarea && input) {
      input.style.borderColor = 'var(--accent-red)';
      input.style.boxShadow = '0 0 0 1px var(--accent-red)';
    }
    if (errEl) { errEl.textContent = msg; errEl.hidden = false; }
    if (input) input.setAttribute('aria-invalid', 'true');
    return false;
  }

  function clearFieldError(input, wrap, errEl, isTextarea = false) {
    if (!isTextarea && wrap) wrap.classList.remove('has-error');
    else if (isTextarea && input) {
      input.style.borderColor = '';
      input.style.boxShadow = '';
    }
    if (errEl) errEl.hidden = true;
    if (input) input.removeAttribute('aria-invalid');
    return true;
  }

  // Validación en tiempo real al perder foco
  tituloInput?.addEventListener('blur', validateTitulo);
  descInput?.addEventListener('blur', validateDesc);
  ubicInput?.addEventListener('blur', validateUbicacion);

  // ── Envío del formulario ──────────────────────────────────────────────────
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const v1 = validateTitulo();
    const v2 = validateCat();
    const v3 = validateDesc();
    const v4 = validateUbicacion();

    if (!v1 || !v2 || !v3 || !v4) {
      showBanner('error', 'Corrige los campos marcados antes de continuar.');
      return;
    }

    setLoading(true);
    showBanner('info', 'Publicando reporte en la base de datos MySQL…');

    const API_BASE = window.SEGURIA_API_BASE || 'http://127.0.0.1:8000';
    const latVal = latInput.value ? Number(latInput.value) : 4.6097;
    const lngVal = lngInput.value ? Number(lngInput.value) : -74.0817;

    const payload = {
      titulo: tituloInput.value.trim(),
      descripcion: descInput.value.trim(),
      categoriaId: selectedCat.id,
      lat: latVal,
      lng: lngVal
    };

    try {
      await fetch(`${API_BASE}/api/reportes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (apiErr) {
      console.warn('[SegurIA] No se pudo guardar en backend MySQL, manteniendo copia local:', apiErr);
    }

    const nuevo = agregarReporteLocal({
      titulo:      tituloInput.value.trim(),
      descripcion: descInput.value.trim(),
      categoria:   selectedCat.nombre,
      categoriaId: selectedCat.id,
      ubicacion:   ubicInput.value.trim(),
      lat:         latVal,
      lng:         lngVal,
    });

    setLoading(false);
    console.info('[SegurIA] Reporte de demostración agregado:', nuevo);

    // Abrir modal de confirmación
    if (confirmModal) {
      confirmModal.showModal?.() || (confirmModal.style.display = 'flex');
    }
  });

  // ── Cierre del modal de confirmación ──────────────────────────────────────
  const closeConfirmBtn  = document.getElementById('closeConfirmBtn');
  const closeConfirmBtn2 = document.getElementById('closeConfirmBtn2');

  function closeConfirm() {
    if (confirmModal) {
      confirmModal.close?.();
    }
    form.reset();
    selectedCat = null;
    selectedMarker = null;
    if (coordText) coordText.textContent = 'Haz clic en el mapa para seleccionar una ubicación';
    if (coordDisplay) coordDisplay.classList.remove('has-coords');
    if (coordStatus)  coordStatus.textContent = 'Sin selección';
    catGrid?.querySelectorAll('.cat-selector-btn').forEach(b => {
      b.classList.remove('selected');
      b.style.borderColor = '';
      b.style.background = '';
      b.style.color = '';
      b.setAttribute('aria-pressed', 'false');
    });
    if (miniMap && selectedMarker) {
      miniMap.removeLayer(selectedMarker);
      selectedMarker = null;
    }
    hideBanner();
  }

  closeConfirmBtn?.addEventListener('click', closeConfirm);
  closeConfirmBtn2?.addEventListener('click', closeConfirm);

  // ── Utilidades ────────────────────────────────────────────────────────────
  function showBanner(type, msg) {
    if (!banner) return;
    banner.className = `form-status-banner ${type}`;
    banner.textContent = msg;
    banner.hidden = false;
  }

  function hideBanner() {
    if (banner) banner.hidden = true;
  }

  function setLoading(on) {
    if (!submitBtn) return;
    submitBtn.setAttribute('aria-busy', String(on));
    submitBtn.disabled = on;
  }

  function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
  }
})();
