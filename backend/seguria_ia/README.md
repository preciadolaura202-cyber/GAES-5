# Componente de Inteligencia Artificial Geoespacial — SegurIA (GAES-5)

Módulo inteligente de análisis espacial, detección de concentraciones delictivas (hotspots) y clasificación estadística de niveles de riesgo urbano para la plataforma comunitaria **SegurIA**.

---

## 1. Contexto y Fuentes de Datos
- **Fuente de Información Histórica:** Dataset oficial de incidentes y delitos del Municipio de Bucaramanga y su Área Metropolitana (Santander, Colombia).
- **Archivo Original:** `Delitos_ocurridos_en_el_Municipio_de_Bucaramanga_20250403.csv` (135,076 registros originales).
- **Archivo Procesado:** `data/processed/delitos_bucaramanga_limpio.csv` (111,968 registros válidos y desduplicados).
- **Tasa de Utilidad de Datos:** **82.89%**.

---

## 2. Arquitectura de Carpetas del Módulo

```text
backend/seguria_ia/
├── data/
│   ├── original/              # Dataset histórico preservado intacto
│   └── processed/             # Dataset depurado y reporte JSON de calidad
├── models/
│   └── modelo_geoespacial.pkl # Checkpoint serializado del agrupador DBSCAN
├── analysis/
│   ├── preprocessing.py       # Limpieza, parseo de coordenadas y mapeo
│   ├── geospatial.py          # Agrupamiento espacial DBSCAN (métrica Haversine)
│   ├── risk_analysis.py       # Clasificación estadística de riesgo (Bajo/Medio/Alto)
│   ├── temporal_analysis.py   # Métricas temporales (año, mes, día de semana)
│   └── heatmap.py             # Matriz ponderada para Leaflet.heat
├── api/
│   ├── routes.py              # 7 endpoints RESTful integrados en FastAPI
│   └── schemas.py             # Modelos de validación Pydantic
├── database/
│   ├── integration.py         # Fusión con reportes MySQL en vivo
│   └── ia_schema.sql          # Tablas opcionales para persistencia en MySQL
├── tests/
│   └── test_ia_pipeline.py    # Suite de pruebas unitarias automáticas
├── requirements.txt           # Dependencias científicas y geoespaciales
└── README.md                  # Este documento
```

---

## 3. Endpoints REST Disponibles (`/api/ia`)

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/ia/estado` | Retorna el estado del agente, versión, límites geográficos y métricas activas. |
| `POST` | `/api/ia/analizar` | Ejecuta o reentrena el agrupamiento espacial con parámetros configurables. |
| `GET` | `/api/ia/incidentes` | Retorna incidentes procesados con filtros (`categoria`, `ano`, `comuna`, `limite`, `offset`). |
| `GET` | `/api/ia/agrupaciones` | Lista los conglomerados geográficos identificados con sus centroides y radios. |
| `GET` | `/api/ia/zonas-riesgo` | Retorna los sectores clasificados en riesgo `Bajo`, `Medio` o `Alto` (puntuación 0-100). |
| `GET` | `/api/ia/mapa-calor` | Matriz `[[lat, lng, intensidad], ...]` para alimentar directamente `L.heatLayer()`. |
| `GET` | `/api/ia/estadisticas` | Estadísticas temporales: evolución anual, distribución mensual y días pico. |

---

## 4. Metodología de Inteligencia Artificial

1. **Agrupamiento Geoespacial (DBSCAN con Haversine):**
   - Utiliza la fórmula de Haversine sobre coordenadas terrestres para calcular distancias esféricas reales en metros.
   - Parámetros por defecto: `eps = 300 m`, `min_samples = 20`.
   - Aísla el ruido estadístico (incidentes dispersos) y detecta conglomerados orgánicos sin forzar figuras geométricas arbitrarias.

2. **Clasificación Estadística de Riesgo:**
   - Criterio objetivo basado en el percentil 90 ($P_{90}$) de volumen de incidentes.
   - Puntuación normalizada de 0 a 100 puntos.
   - Umbrales configurables:
     - **Riesgo Bajo:** Puntuación $< 40$ (Verde: `#10B981`)
     - **Riesgo Medio:** Puntuación entre $40$ y $69$ (Ámbar: `#F59E0B`)
     - **Riesgo Alto:** Puntuación $\ge 70$ (Rojo: `#EF4444`)

---

## 5. Principios Éticos y Responsabilidad Algorítmica
- **No se elaboran perfiles de personas:** El análisis se enfoca exclusivamente en la concentración espacial de reportes ciudadanos y registros oficiales.
- **Advertencia metodológica explícita:** Toda respuesta JSON y popup en el mapa incluye una aclaración de que las puntuaciones reflejan densidad histórica y no determinismo delictivo.
- **Anonimización:** Los datos personales no son expuestos ni utilizados para inferencias individuales.
