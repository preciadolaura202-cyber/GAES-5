"""
SegurIA — Módulo de Análisis Geoespacial y Agrupamiento Espacial (DBSCAN)
Proyecto: SegurIA (GAES-5)
Propósito: Identificar concentraciones espaciales reales de incidentes (hotspots)
           utilizando métrica de Haversine sobre coordenadas terrestres.
"""

import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
from sklearn.cluster import DBSCAN

# Radio medio de la Tierra en kilómetros
EARTH_RADIUS_KM = 6371.0088

class GeospatialClusterer:
    """
    Agrupador geoespacial basado en DBSCAN con métrica Haversine.
    Detecta automáticamente conglomerados de incidentes cercanos sin asumir
    formas preconcebidas y aislando puntos dispersos o aislados (ruido).
    """

    def __init__(self, eps_meters: float = 300.0, min_samples: int = 20):
        """
        :param eps_meters: Radio de vecindad máxima en metros (default: 300 m).
        :param min_samples: Cantidad mínima de incidentes para consolidar un clúster.
        """
        self.eps_meters = eps_meters
        self.min_samples = min_samples
        self.eps_radians = (eps_meters / 1000.0) / EARTH_RADIUS_KM
        self.model: Optional[DBSCAN] = None
        self.clusters_summary: List[Dict[str, Any]] = []
        self.noise_count: int = 0
        self.total_clustered: int = 0

    def fit_and_summarize(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Ajusta el modelo DBSCAN sobre un DataFrame con columnas 'lat' y 'lng'.
        Genera un resumen estructurado de cada agrupación identificada.
        """
        if df.empty or len(df) < self.min_samples:
            self.clusters_summary = []
            return []

        # Convertir coordenadas a radianes para la métrica haversine: [lat, lng]
        coords_rad = np.radians(df[["lat", "lng"]].to_numpy())

        self.model = DBSCAN(
            eps=self.eps_radians,
            min_samples=self.min_samples,
            metric="haversine",
            algorithm="ball_tree"
        )
        labels = self.model.fit_predict(coords_rad)
        df_work = df.copy()
        df_work["cluster_id"] = labels

        # Estadísticas de ruido
        noise_mask = (labels == -1)
        self.noise_count = int(noise_mask.sum())
        self.total_clustered = int((~noise_mask).sum())

        summary = []
        unique_clusters = [c for c in np.unique(labels) if c != -1]

        for cid in unique_clusters:
            cluster_points = df_work[df_work["cluster_id"] == cid]
            n_incidents = len(cluster_points)
            
            # Centroide medio
            center_lat = float(cluster_points["lat"].mean())
            center_lng = float(cluster_points["lng"].mean())

            # Radio máximo del clúster en metros usando aproximación euclidiana local
            lat_diff_m = (cluster_points["lat"] - center_lat) * 111139.0
            lng_diff_m = (cluster_points["lng"] - center_lng) * (111139.0 * np.cos(np.radians(center_lat)))
            distances_m = np.sqrt(lat_diff_m**2 + lng_diff_m**2)
            radio_estimado_m = float(np.percentile(distances_m, 90)) # percentil 90 para robustez

            # Categoría predominante y distribución
            cat_counts = cluster_points["categoria"].value_counts().to_dict()
            predominant_cat = cluster_points["categoria"].mode().iloc[0] if not cluster_points["categoria"].empty else "Desconocido"

            # Comunas / Barrios más frecuentes en este sector
            barrio_top = cluster_points["barrio"].mode().iloc[0] if "barrio" in cluster_points and not cluster_points["barrio"].empty else "Sector Urbano"
            comuna_top = cluster_points["comuna"].mode().iloc[0] if "comuna" in cluster_points and not cluster_points["comuna"].empty else ""

            summary.append({
                "cluster_id": int(cid),
                "sector_nombre": f"Sector {barrio_top}",
                "comuna": comuna_top,
                "centro": {
                    "latitud": round(center_lat, 6),
                    "longitud": round(center_lng, 6)
                },
                "radio_metros": round(radio_estimado_m, 1),
                "cantidad_incidentes": n_incidents,
                "categoria_predominante": predominant_cat,
                "distribucion_categorias": {str(k): int(v) for k, v in cat_counts.items()},
                "metodo_analisis": "DBSCAN_haversine"
            })

        # Ordenar de mayor a menor cantidad de incidentes
        summary.sort(key=lambda x: x["cantidad_incidentes"], reverse=True)
        self.clusters_summary = summary
        return summary

    def save_model(self, file_path: str):
        """Guarda el agrupador entrenado y su resumen."""
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        joblib.dump({
            "eps_meters": self.eps_meters,
            "min_samples": self.min_samples,
            "clusters_summary": self.clusters_summary,
            "noise_count": self.noise_count,
            "total_clustered": self.total_clustered
        }, file_path)

    @classmethod
    def load_model(cls, file_path: str) -> "GeospatialClusterer":
        """Carga un agrupador previamente ajustado."""
        data = joblib.load(file_path)
        instance = cls(eps_meters=data["eps_meters"], min_samples=data["min_samples"])
        instance.clusters_summary = data.get("clusters_summary", [])
        instance.noise_count = data.get("noise_count", 0)
        instance.total_clustered = data.get("total_clustered", 0)
        return instance
