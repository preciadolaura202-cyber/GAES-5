/**
 * SegurIA — Módulo de Datos de Demostración
 * 
 * IMPORTANTE: Todos los datos en este archivo son ficticios y han sido creados
 * únicamente para demostrar el flujo visual de la aplicación.
 * No representan incidentes reales ni ubicaciones de riesgo comprobadas.
 * 
 * TODO (Backend): Reemplazar cada función getDemo* por una llamada fetch() real
 * al endpoint correspondiente en la API de SegurIA.
 */

"use strict";

// ============================================================
// CATEGORÍAS
// TODO: GET /api/categorias
// ============================================================
const CATEGORIAS = [
  { id: 1, nombre: "Robo",                 color: "#EF4444", icono: "🔴" },
  { id: 2, nombre: "Acoso",               color: "#F97316", icono: "🟠" },
  { id: 3, nombre: "Situación sospechosa",color: "#EAB308", icono: "🟡" },
  { id: 4, nombre: "Accidente",           color: "#3B82F6", icono: "🔵" },
  { id: 5, nombre: "Otro",               color: "#8B5CF6", icono: "🟣" },
];

// ============================================================
// REPORTES DE DEMOSTRACIÓN
// TODO: GET /api/reportes
// ============================================================
const DEMO_REPORTES = [
  {
    id: 1,
    titulo: "Robo de celular en el parque central",
    descripcion: "Se reporta sustracción de teléfono móvil cerca de la fuente principal. El incidente ocurrió alrededor de las 7 p.m. cuando la víctima conversaba con un amigo.",
    categoria: "Robo",
    categoriaId: 1,
    ubicacion: "Parque Santander, Calle 35 con Carrera 19, Centro",
    lat: 7.1182,
    lng: -73.1264,
    fecha: "15/10/2026",
    hora: "19:05",
    autor: "Reporte Ciudadano Anónimo",
    demo: true
  },
  {
    id: 2,
    titulo: "Acoso verbal en la estación de Transmilenio",
    descripcion: "Una persona reporta haber sido víctima de acoso verbal reiterado en el andén de la estación. Se describe al individuo como de complexión delgada y ropa oscura.",
    categoria: "Acoso",
    categoriaId: 2,
    ubicacion: "Estación Metrolínea Provenza, Autopista Sur",
    lat: 7.0865,
    lng: -73.1165,
    fecha: "15/10/2026",
    hora: "08:30",
    autor: "Reporte Ciudadano Anónimo",
    demo: true
  },
  {
    id: 3,
    titulo: "Vehículo sospechoso estacionado",
    descripcion: "Un automóvil de color gris lleva más de 6 horas estacionado frente a una residencia. Los vecinos reportan movimiento inusual en el interior.",
    categoria: "Situación sospechosa",
    categoriaId: 3,
    ubicacion: "Carrera 33 con Calle 48, Cabecera del Llano",
    lat: 7.1165,
    lng: -73.1098,
    fecha: "14/10/2026",
    hora: "14:20",
    autor: "Reporte Ciudadano Anónimo",
    demo: true
  },
  {
    id: 4,
    titulo: "Choque entre motocicleta y camioneta",
    descripcion: "Accidente de tránsito en la intersección. Dos personas heridas leves; se solicitó asistencia médica. Vía parcialmente bloqueada.",
    categoria: "Accidente",
    categoriaId: 4,
    ubicacion: "Viaducto García Cadena, Cra 27",
    lat: 7.1030,
    lng: -73.1185,
    fecha: "14/10/2026",
    hora: "17:45",
    autor: "Reporte Ciudadano Anónimo",
    demo: true
  },
  {
    id: 5,
    titulo: "Alumbrado público apagado varias noches",
    descripcion: "Tramo de cuatro postes de alumbrado sin funcionar desde hace tres días, generando inseguridad en la zona peatonal nocturna.",
    categoria: "Otro",
    categoriaId: 5,
    ubicacion: "Calle 56 con Carrera 17, Ciudadela Real de Minas",
    lat: 7.1080,
    lng: -73.1280,
    fecha: "13/10/2026",
    hora: "21:00",
    autor: "Reporte Ciudadano Anónimo",
    demo: true
  },
  {
    id: 6,
    titulo: "Riña en establecimiento nocturno",
    descripcion: "Se reporta pelea entre grupos en el exterior de un bar. Vidrios rotos y daño a vehículos cercanos. Zona acordonada por residentes.",
    categoria: "Robo",
    categoriaId: 1,
    ubicacion: "Sector Cuadra Play, Calle 49 con Cra 34, Cabecera",
    lat: 7.1158,
    lng: -73.1085,
    fecha: "13/10/2026",
    hora: "23:15",
    autor: "Reporte Ciudadano Anónimo",
    demo: true
  },
  {
    id: 7,
    titulo: "Persona en situación de calle con comportamiento agresivo",
    descripcion: "Se observa a una persona que interpela agresivamente a los transeúntes y bloquea la entrada de un comercio. Se solicita apoyo.",
    categoria: "Situación sospechosa",
    categoriaId: 3,
    ubicacion: "Parque San Pío, Carrera 33 con Calle 45, Sotomayor",
    lat: 7.1190,
    lng: -73.1120,
    fecha: "12/10/2026",
    hora: "11:30",
    autor: "Reporte Ciudadano Anónimo",
    demo: true
  },
  {
    id: 8,
    titulo: "Ciclista arrollado sin asistencia",
    descripcion: "Un ciclista fue golpeado por un automóvil que no se detuvo. El ciclista presenta heridas en el brazo y rodilla. Testigos tomaron la placa.",
    categoria: "Accidente",
    categoriaId: 4,
    ubicacion: "Bulevar Santander con Carrera 21, San Francisco",
    lat: 7.1350,
    lng: -73.1250,
    fecha: "12/10/2026",
    hora: "07:00",
    autor: "Reporte Ciudadano Anónimo",
    demo: true
  },
];

// ============================================================
// ESTADÍSTICAS DE RESUMEN (para tarjetas del dashboard)
// TODO: GET /api/estadisticas/resumen
// ============================================================
const DEMO_STATS = {
  totalReportes: 8,
  reportesHoy: 2,
  zonasMapeadas: 5,
  reportesMes: 24,
  porCategoria: {
    "Robo": 2,
    "Acoso": 1,
    "Situación sospechosa": 2,
    "Accidente": 2,
    "Otro": 1,
  }
};

// ============================================================
// ZONA INICIAL DEL MAPA (Bogotá, Colombia)
// ============================================================
const MAPA_CENTRO = { lat: 7.1193, lng: -73.1227, zoom: 14 }; // Bucaramanga, Colombia

// ============================================================
// ESTADO LOCAL EN MEMORIA (simula la "base de datos" del frontend)
// Se vacía al recargar la página.
// TODO: Reemplazar por llamadas reales a la API
// ============================================================
let _reportesLocales = [...DEMO_REPORTES];
let _nextId = DEMO_REPORTES.length + 1;

function getDemoReportes() {
  return [..._reportesLocales];
}

function getDemoReporteById(id) {
  return _reportesLocales.find(r => r.id === id) || null;
}

function agregarReporteLocal(reporte) {
  const nuevo = {
    ...reporte,
    id: _nextId++,
    fecha: new Date().toLocaleDateString('es-CO'),
    hora: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
    autor: "Reporte Ciudadano Anónimo",
    demo: true,
  };
  _reportesLocales.unshift(nuevo);
  return nuevo;
}

function getDemoCategorias() {
  return [...CATEGORIAS];
}

function getDemoStats() {
  return { ...DEMO_STATS, totalReportes: _reportesLocales.length };
}

function eliminarReporteLocal(id) {
  const index = _reportesLocales.findIndex(r => r.id === id);
  if (index !== -1) {
    _reportesLocales.splice(index, 1);
  }
}

// Exportar para uso modular (compatibilidad con script type=module y script clásico)
if (typeof window !== 'undefined') {
  window.SegurIAData = {
    CATEGORIAS,
    MAPA_CENTRO,
    getDemoReportes,
    getDemoReporteById,
    agregarReporteLocal,
    eliminarReporteLocal,
    getDemoCategorias,
    getDemoStats,
  };
}
