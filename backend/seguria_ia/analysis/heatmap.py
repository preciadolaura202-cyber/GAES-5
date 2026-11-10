"""
SegurIA — Módulo de Generación de Capas de Mapa de Calor (Leaflet.heat)
Proyecto: SegurIA (GAES-5)
Propósito: Formatear puntos e intensidades espaciales ponderadas compatibles
           con Leaflet.heat ([lat, lng, intensidad]) y densidad kernel.
"""

from typing import List, Dict, Any, Optional
import pandas as pd
import numpy as np

# Ponderación de severidad relativa según categoría de incidente
SEVERITY_WEIGHTS = {
    "Robo": 1.0,
    "Hurto": 0.75,
    "Acoso": 0.85,
    "Vandalismo": 0.50,
    "Otro": 0.40
}

class HeatmapGenerator:
    """
    Genera matrices de calor geoespaciales compatibles con Leaflet.heat:
    [[lat, lng, intensity], ...]
    """

    @staticmethod
    def generate_points(
        df: pd.DataFrame,
        categoria: Optional[str] = None,
        max_points: int = 5000,
        sample_strategy: str = "density"
    ) -> Dict[str, Any]:
        """
        Produce una lista de puntos [lat, lng, peso] optimizada para renderizado rápido
        en el navegador sin saturar la memoria ni la GPU de Leaflet.
        """
        if df.empty:
            return {
                "tipo": "heatmap_leaflet",
                "total_puntos": 0,
                "configuracion_recomendada": {
                    "radius": 22,
                    "blur": 15,
                    "maxZoom": 17,
                    "max": 1.0
                },
                "puntos": []
            }

        df_subset = df
        if categoria and categoria.lower() != "todas" and categoria.lower() != "all":
            df_subset = df[df["categoria"].str.lower() == categoria.lower()]

        if df_subset.empty:
            return {
                "tipo": "heatmap_leaflet",
                "total_puntos": 0,
                "categoria_filtrada": categoria,
                "puntos": []
            }

        # Aplicar ponderación
        weights = df_subset["categoria"].map(lambda c: SEVERITY_WEIGHTS.get(c, 0.5)).to_numpy()

        # Si el tamaño supera max_points, tomar una muestra estratificada o representativa
        if len(df_subset) > max_points:
            sample_indices = np.random.choice(len(df_subset), size=max_points, replace=False)
            lats = df_subset["lat"].iloc[sample_indices].to_numpy()
            lngs = df_subset["lng"].iloc[sample_indices].to_numpy()
            intensities = weights[sample_indices]
        else:
            lats = df_subset["lat"].to_numpy()
            lngs = df_subset["lng"].to_numpy()
            intensities = weights

        points = []
        for lat, lng, w in zip(lats, lngs, intensities):
            points.append([round(float(lat), 6), round(float(lng), 6), round(float(w), 2)])

        return {
            "tipo": "heatmap_leaflet",
            "categoria_filtrada": categoria or "todas",
            "total_puntos": len(points),
            "configuracion_recomendada": {
                "radius": 22,
                "blur": 15,
                "maxZoom": 17,
                "max": 1.0,
                "gradient": {
                    "0.2": "#00ffcc",
                    "0.4": "#22c55e",
                    "0.6": "#eab308",
                    "0.8": "#f97316",
                    "1.0": "#ef4444"
                }
            },
            "puntos": points
        }
