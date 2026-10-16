/**
 * SegurIA — reportes.js
 * Lista de reportes con búsqueda de texto y filtros por categoría.
 *
 * TODO (Backend):
 *  - getDemoReportes() → GET /api/reportes
 *  - Agregar paginación cuando haya más de N reportes
 */
"use strict";

(function () {
  if (typeof window.SegurIAData === 'undefined') {
    console.error('[SegurIA] demo-data.js no cargado.');
    return;
  }

  const { getDemoReportes, getDemoCategorias } = window.SegurIAData;

  const grid          = document.getElementById('reportesGrid');
  const emptyState    = document.getElementById('emptyState');
  const searchInput   = document.getElementById('reportSearch');
  const filterRow     = document.getElementById('reportCatFilters');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');

  let cats    = getDemoCategorias();
  let reportes = getDemoReportes();
  let activeCat = 'all';
  let searchQ   = '';

  // ── Construir filtros de categoría ────────────────────────────────────────
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
      render();
    });
  }

  // ── Búsqueda ──────────────────────────────────────────────────────────────
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQ = searchInput.value.trim().toLowerCase();
      render();
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      searchQ = '';
      activeCat = 'all';
      if (searchInput) searchInput.value = '';
      filterRow?.querySelectorAll('.cat-filter-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
      render();
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function render() {
    // Refrescar datos (por si se agregaron reportes locales)
    reportes = getDemoReportes();

    const filtered = reportes.filter(r => {
      const matchCat = activeCat === 'all' || String(r.categoriaId) === activeCat;
      const matchQ   = !searchQ ||
        r.titulo.toLowerCase().includes(searchQ) ||
        r.descripcion.toLowerCase().includes(searchQ) ||
        r.ubicacion.toLowerCase().includes(searchQ);
      return matchCat && matchQ;
    });

    if (!grid) return;

    if (!filtered.length) {
      grid.innerHTML = '';
      if (emptyState) emptyState.hidden = false;
      return;
    }

    if (emptyState) emptyState.hidden = true;

    grid.innerHTML = filtered.map(r => {
      const cat   = cats.find(c => c.nombre === r.categoria);
      const color = cat ? cat.color : '#94A3B8';
      return `
        <article class="report-card" aria-label="Reporte: ${r.titulo}">
          <div class="report-card-header">
            <h3 class="report-card-title">${r.titulo}</h3>
            <span class="report-cat-badge" style="background:${color}22; border:1px solid ${color}55; color:${color};">
              ${cat?.icono || ''} ${r.categoria}
            </span>
          </div>

          <p class="report-card-desc">${r.descripcion}</p>

          <div class="report-card-meta">
            <div class="report-meta-row">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>${r.ubicacion}</span>
            </div>
            <div class="report-meta-row">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>${r.fecha} — ${r.hora}</span>
            </div>
          </div>

          <div class="report-card-footer">
            <span class="report-demo-badge">Reporte comunitario · demo</span>
            <a href="detalle-reporte.html?id=${r.id}" class="btn-accent-sm" aria-label="Ver detalle del reporte: ${r.titulo}">Ver detalle</a>
          </div>
        </article>
      `;
    }).join('');
  }

  // Render inicial
  render();
})();
