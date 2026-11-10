"""
SegurIA — Módulo de Clasificación Estadística de Zonas de Riesgo
Proyecto: SegurIA (GAES-5)
Propósito: Clasificar sectores y agrupaciones geográficas según la concentración
           y frecuencia de reportes usando métodos estadísticos objetivos y transparentes.
"""

from typing import List, Dict, Any
import numpy as np

DISCLAIMER_METODOLOGICO = (
    "Nota metodológica: La categorización de riesgo se fundamenta exclusivamente en "
    "la densidad histórica de reportes e incidentes registrados en el sector. "
    "No representa una probabilidad comprobada de delito futuro ni una calificación "
    "sobre la peligrosidad de los ciudadanos o habitantes de la zona."
)

class RiskClassifier:
    """
    Clasificador estadístico de nivel de riesgo basado en densidad de incidentes,
    percentiles empíricos y normalización escalada de 0 a 100.
    """

    def __init__(self, umbral_medio: float = 40.0, umbral_alto: float = 70.0):
        """
        :param umbral_medio: Puntuación (0-100) para clasificar como Riesgo Medio.
        :param umbral_alto: Puntuación (0-100) para clasificar como Riesgo Alto.
        """
        self.umbral_medio = umbral_medio
        self.umbral_alto = umbral_alto

    def classify_clusters(self, clusters: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Recibe las agrupaciones espaciales calculadas y les asigna una puntuación
        normalizada (0 - 100) y su categoría: 'Bajo', 'Medio' o 'Alto'.
        """
        if not clusters:
            return []

        counts = np.array([c["cantidad_incidentes"] for c in clusters], dtype=float)
        
        # Usamos percentil 90 como referencia de saturación para que sectores moderados no queden aplastados
        ref_val = float(np.percentile(counts, 90)) if len(counts) > 5 else float(np.max(counts))
        if ref_val <= 0:
            ref_val = 1.0

        classified_clusters = []
        for cluster in clusters:
            n = cluster["cantidad_incidentes"]
            
            # Puntuación proporcional al percentil de corte, acotada en [0, 100]
            raw_score = (n / ref_val) * 80.0 # El percentil 90 alcanza score 80
            score = int(min(100, max(10, round(raw_score))))

            # Clasificación por umbrales ajustables
            if score >= self.umbral_alto:
                nivel = "Alto"
                color_hex = "#EF4444" # Rojo táctico SegurIA
            elif score >= self.umbral_medio:
                nivel = "Medio"
                color_hex = "#F59E0B" # Ámbar táctico SegurIA
            else:
                nivel = "Bajo"
                color_hex = "#10B981" # Esmeralda táctico SegurIA

            item = dict(cluster)
            item.update({
                "nivel_riesgo": nivel,
                "puntuacion": score,
                "color_hex": color_hex,
                "criterio_estadistico": {
                    "umbral_medio": self.umbral_medio,
                    "umbral_alto": self.umbral_alto,
                    "incidente_referencia_p90": round(ref_val, 1)
                },
                "advertencia": DISCLAIMER_METODOLOGICO
            })
            classified_clusters.append(item)

        return classified_clusters
