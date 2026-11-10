"""
SegurIA — Endpoints FastAPI del Agente de Inteligencia Artificial Geoespacial
Proyecto: SegurIA (GAES-5)
Propósito: Conectar el agente de análisis geoespacial con el backend y frontend de SegurIA.
"""

import os
import time
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, status
import pandas as pd

from ..analysis.preprocessing import clean_incidents_data, GEO_BOUNDS
from ..analysis.geospatial import GeospatialClusterer
from ..analysis.risk_analysis import RiskClassifier, DISCLAIMER_METODOLOGICO
from ..analysis.temporal_analysis import TemporalAnalyzer
from ..analysis.heatmap import HeatmapGenerator
from ..database.integration import DatabaseIntegration
from .schemas import (
    AgenteEstadoResponse,
    AnalizarRequest,
    AnalizarResponse,
    ZonaRiesgoResponse,
    HeatmapResponse
)

router = APIRouter(prefix="/api/ia", tags=["Agente IA Geoespacial"])

# Rutas de archivos
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGINAL_CSV = os.path.join(BASE_DIR, "data", "original", "Delitos_ocurridos_en_el_Municipio_de_Bucaramanga_20250403.csv")
PROCESSED_CSV = os.path.join(BASE_DIR, "data", "processed", "delitos_bucaramanga_limpio.csv")
MODEL_PKL = os.path.join(BASE_DIR, "models", "modelo_geoespacial.pkl")

# Estado en memoria (Singleton del Agente)
class AgentState:
    df_data: Optional[pd.DataFrame] = None
    clusterer: Optional[GeospatialClusterer] = None
    classifier: Optional[RiskClassifier] = None
    zonas_clasificadas: List[Dict[str, Any]] = []
    fecha_ultimo_analisis: Optional[str] = None
    inicializado: bool = False

state = AgentState()

def initialize_agent():
    """Inicializa los datos y el modelo del agente al arrancar el servidor."""
    if state.inicializado:
        return

    # 1. Asegurar archivo procesado
    if not os.path.exists(PROCESSED_CSV):
        if os.path.exists(ORIGINAL_CSV):
            clean_incidents_data(ORIGINAL_CSV, PROCESSED_CSV)
        else:
            return

    # 2. Cargar datos limpios
    if os.path.exists(PROCESSED_CSV):
        state.df_data = pd.read_csv(PROCESSED_CSV, encoding="utf-8")
    else:
        state.df_data = pd.DataFrame()

    state.classifier = RiskClassifier(umbral_medio=40.0, umbral_alto=70.0)

    # 3. Intentar cargar modelo previamente entrenado o entrenar
    if os.path.exists(MODEL_PKL):
        try:
            state.clusterer = GeospatialClusterer.load_model(MODEL_PKL)
            state.zonas_clasificadas = state.classifier.classify_clusters(state.clusterer.clusters_summary)
            state.fecha_ultimo_analisis = datetime.fromtimestamp(os.path.getmtime(MODEL_PKL)).strftime("%Y-%m-%d %H:%M:%S")
            state.inicializado = True
            return
        except Exception:
            pass

    # Si no había modelo guardado, ejecutar análisis inicial sobre muestra representativa reciente
    run_full_analysis(eps_m=300.0, min_samp=25, incluir_db=False)
    state.inicializado = True

def run_full_analysis(eps_m: float = 300.0, min_samp: int = 25, incluir_db: bool = True) -> float:
    """Ejecuta el pipeline completo de clustering y clasificación de riesgo."""
    t0 = time.time()
    
    if state.df_data is None or state.df_data.empty:
        if os.path.exists(PROCESSED_CSV):
            state.df_data = pd.read_csv(PROCESSED_CSV, encoding="utf-8")
        else:
            state.df_data = pd.DataFrame()

    df_full = state.df_data.copy()

    # Opcional: Fusionar con reportes en vivo de MySQL si existen
    if incluir_db:
        df_live = DatabaseIntegration.get_live_reports()
        if not df_live.empty:
            df_full = pd.concat([df_full, df_live], ignore_index=True).drop_duplicates(subset=["lat", "lng", "conducta_detalle"])

    # Para el agrupador espacial usamos los incidentes más relevantes y representativos (recientes o muestra estratificada)
    # asegurando alta sensibilidad en hotspots actuales
    df_cluster_sample = df_full[df_full["ano"] >= 2018]
    if len(df_cluster_sample) < 1000:
        df_cluster_sample = df_full

    state.clusterer = GeospatialClusterer(eps_meters=eps_m, min_samples=min_samp)
    raw_clusters = state.clusterer.fit_and_summarize(df_cluster_sample)

    state.classifier = RiskClassifier(umbral_medio=40.0, umbral_alto=70.0)
    state.zonas_clasificadas = state.classifier.classify_clusters(raw_clusters)
    state.fecha_ultimo_analisis = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Guardar modelo
    state.clusterer.save_model(MODEL_PKL)

    duracion = time.time() - t0
    # Guardar en base de datos opcionalmente
    DatabaseIntegration.save_analysis_results(state.zonas_clasificadas, duracion_segundos=duracion)

    return duracion


# 1. Consultar estado del agente
@router.get("/estado", response_model=AgenteEstadoResponse)
def get_agente_estado():
    """Retorna el estado operativo, cobertura territorial y metadatos del agente IA."""
    initialize_agent()
    total_inc = len(state.df_data) if state.df_data is not None else 0
    total_zonas = len(state.zonas_clasificadas)

    return {
        "agente_activo": True,
        "version_agente": "1.0.0-GAES5",
        "algoritmo_principal": "DBSCAN Haversine + Clasificación Percentil P90",
        "limites_geograficos": GEO_BOUNDS,
        "territorio_analisis": "Bucaramanga y Área Metropolitana (Santander, Colombia)",
        "total_incidentes_dataset": total_inc,
        "total_zonas_riesgo_activas": total_zonas,
        "fecha_ultimo_analisis": state.fecha_ultimo_analisis,
        "archivo_procesado": os.path.basename(PROCESSED_CSV)
    }


# 2. Ejecutar o actualizar el análisis de los datos
@router.post("/analizar", response_model=AnalizarResponse)
def post_ejecutar_analisis(body: AnalizarRequest):
    """
    Ejecuta o reentrena el análisis geoespacial ajustando parámetros DBSCAN
    y umbrales estadísticos de riesgo.
    """
    initialize_agent()
    duracion = run_full_analysis(
        eps_m=body.eps_metros or 300.0,
        min_samp=body.min_samples or 20,
        incluir_db=body.incluir_mysql if body.incluir_mysql is not None else True
    )

    niveles = {"Bajo": 0, "Medio": 0, "Alto": 0}
    for z in state.zonas_clasificadas:
        lvl = z.get("nivel_riesgo", "Bajo")
        niveles[lvl] = niveles.get(lvl, 0) + 1

    return {
        "ok": True,
        "mensaje": "Análisis geoespacial y clasificación de riesgo actualizados exitosamente.",
        "duracion_segundos": round(duracion, 3),
        "total_incidentes_analizados": len(state.df_data) if state.df_data is not None else 0,
        "total_zonas_identificadas": len(state.zonas_clasificadas),
        "resumen_niveles": niveles,
        "advertencia_metodologica": DISCLAIMER_METODOLOGICO
    }


# 3. Obtener los incidentes procesados
@router.get("/incidentes")
def get_incidentes(
    categoria: Optional[str] = Query(None, description="Filtrar por categoría (Hurto, Robo, Acoso, Vandalismo, Otro)"),
    ano: Optional[int] = Query(None, description="Filtrar por año"),
    comuna: Optional[str] = Query(None, description="Filtrar por comuna"),
    limite: int = Query(100, ge=1, le=5000, description="Cantidad máxima de incidentes a devolver"),
    offset: int = Query(0, ge=0)
):
    """
    Retorna la lista de incidentes individuales procesados y geolocalizados,
    con filtros por categoría, año y comuna.
    """
    initialize_agent()
    if state.df_data is None or state.df_data.empty:
        return {"total": 0, "incidentes": []}

    df_filtered = state.df_data
    if categoria and categoria.lower() != "todas" and categoria.lower() != "all":
        df_filtered = df_filtered[df_filtered["categoria"].str.lower() == categoria.lower()]

    if ano:
        df_filtered = df_filtered[df_filtered["ano"] == ano]

    if comuna:
        df_filtered = df_filtered[df_filtered["comuna"].str.contains(comuna, case=False, na=False)]

    total_coincidencias = len(df_filtered)
    page_df = df_filtered.iloc[offset : offset + limite]

    return {
        "total": total_coincidencias,
        "limite": limite,
        "offset": offset,
        "incidentes": page_df.to_dict(orient="records")
    }


# 4. Obtener las agrupaciones geográficas (DBSCAN clusters)
@router.get("/agrupaciones")
def get_agrupaciones():
    """Retorna los conglomerados espaciales identificados por el algoritmo DBSCAN."""
    initialize_agent()
    return {
        "total_agrupaciones": len(state.zonas_clasificadas),
        "agrupaciones": state.zonas_clasificadas
    }


# 5. Obtener las zonas clasificadas por nivel de riesgo
@router.get("/zonas-riesgo", response_model=List[ZonaRiesgoResponse])
def get_zonas_riesgo(
    nivel: Optional[str] = Query(None, description="Filtrar por nivel: 'Bajo', 'Medio' o 'Alto'"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoría predominante")
):
    """
    Retorna las zonas geográficas clasificadas en niveles de riesgo
    (Bajo, Medio, Alto) con sus puntuaciones estadísticas y centroides.
    """
    initialize_agent()
    zonas = state.zonas_clasificadas

    if nivel:
        zonas = [z for z in zonas if z.get("nivel_riesgo", "").lower() == nivel.lower()]

    if categoria:
        zonas = [z for z in zonas if z.get("categoria_predominante", "").lower() == categoria.lower()]

    return zonas


# 6. Obtener los datos necesarios para generar el mapa de calor (Leaflet.heat)
@router.get("/mapa-calor", response_model=HeatmapResponse)
def get_mapa_calor(
    categoria: Optional[str] = Query(None, description="Filtrar por categoría (Hurto, Robo, Acoso, Vandalismo, Otro)"),
    max_puntos: int = Query(3500, ge=10, le=20000, description="Límite de puntos para optimizar Leaflet")
):
    """
    Entrega una matriz [lat, lng, intensidad] lista para alimentar
    L.heatLayer() de Leaflet en el frontend de SegurIA.
    """
    initialize_agent()
    if state.df_data is None or state.df_data.empty:
        return {
            "tipo": "heatmap_leaflet",
            "categoria_filtrada": categoria or "todas",
            "total_puntos": 0,
            "configuracion_recomendada": {},
            "puntos": []
        }

    return HeatmapGenerator.generate_points(
        state.df_data,
        categoria=categoria,
        max_points=max_puntos
    )


# 7. Consultar estadísticas por categoría y período
@router.get("/estadisticas")
def get_estadisticas():
    """
    Retorna el informe consolidado de estadísticas temporales,
    evolución de reportes por año, mes, días de mayor afluencia y distribución de categorías.
    """
    initialize_agent()
    if state.df_data is None or state.df_data.empty:
        return {"mensaje": "No hay datos disponibles para estadísticas"}

    return TemporalAnalyzer.analyze(state.df_data)
