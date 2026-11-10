"""
SegurIA — Schemas Pydantic para la API del Agente de Inteligencia Artificial Geoespacial
Proyecto: SegurIA (GAES-5)
"""

from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

class CoordenadaCentro(BaseModel):
    latitud: float = Field(..., description="Latitud en grados decimales (Bucaramanga)")
    longitud: float = Field(..., description="Longitud en grados decimales (Bucaramanga)")

class ZonaRiesgoResponse(BaseModel):
    cluster_id: int
    sector_nombre: str
    comuna: Optional[str] = ""
    centro: CoordenadaCentro
    radio_metros: float
    cantidad_incidentes: int
    nivel_riesgo: str = Field(..., description="'Bajo', 'Medio' o 'Alto'")
    puntuacion: int = Field(..., description="Puntaje estadístico normalizado de 0 a 100")
    color_hex: str = Field(..., description="Color hexadecimal representativo en Leaflet")
    categoria_predominante: str
    distribucion_categorias: Dict[str, int]
    metodo_analisis: str
    advertencia: Optional[str] = None

class HeatmapConfig(BaseModel):
    radius: int = 22
    blur: int = 15
    maxZoom: int = 17
    max: float = 1.0
    gradient: Optional[Dict[str, str]] = None

class HeatmapResponse(BaseModel):
    tipo: str = "heatmap_leaflet"
    categoria_filtrada: str = "todas"
    total_puntos: int
    configuracion_recomendada: HeatmapConfig
    puntos: List[List[float]] = Field(..., description="Lista de puntos en formato [[lat, lng, peso], ...]")

class AgenteEstadoResponse(BaseModel):
    agente_activo: bool
    version_agente: str
    algoritmo_principal: str
    limites_geograficos: Dict[str, float]
    territorio_analisis: str
    total_incidentes_dataset: int
    total_zonas_riesgo_activas: int
    fecha_ultimo_analisis: Optional[str]
    archivo_procesado: str

class AnalizarRequest(BaseModel):
    eps_metros: Optional[float] = Field(300.0, ge=50.0, le=2000.0, description="Radio de vecindad DBSCAN en metros")
    min_samples: Optional[int] = Field(20, ge=5, le=500, description="Cantidad mínima de incidentes para formar un clúster")
    umbral_medio: Optional[float] = Field(40.0, ge=10.0, le=60.0)
    umbral_alto: Optional[float] = Field(70.0, ge=60.0, le=90.0)
    incluir_mysql: Optional[bool] = Field(True, description="Fusionar con reportes en vivo de la BD MySQL")

class AnalizarResponse(BaseModel):
    ok: bool
    mensaje: str
    duracion_segundos: float
    total_incidentes_analizados: int
    total_zonas_identificadas: int
    resumen_niveles: Dict[str, int]
    advertencia_metodologica: str
