"""
SegurIA — Suite de Pruebas Unitarias y de Integración del Agente IA Geoespacial
Proyecto: SegurIA (GAES-5)
"""

import unittest
import numpy as np
import pandas as pd

from ..analysis.preprocessing import parse_coordinate_latitude, parse_coordinate_longitude, GEO_BOUNDS
from ..analysis.geospatial import GeospatialClusterer
from ..analysis.risk_analysis import RiskClassifier
from ..analysis.temporal_analysis import TemporalAnalyzer
from ..analysis.heatmap import HeatmapGenerator

class TestSegurIAAgente(unittest.TestCase):

    def setUp(self):
        # Muestra controlada de incidentes en Bucaramanga
        self.sample_data = pd.DataFrame([
            {"id_origen": 1, "lat": 7.1182, "lng": -73.1264, "categoria": "Hurto", "ano": 2021, "mes": 5, "dia": 10, "dia_semana": "Lunes", "comuna": "CENTRO", "barrio": "CENTRO", "conducta_detalle": "HURTO A PERSONAS"},
            {"id_origen": 2, "lat": 7.1185, "lng": -73.1260, "categoria": "Hurto", "ano": 2021, "mes": 5, "dia": 11, "dia_semana": "Martes", "comuna": "CENTRO", "barrio": "CENTRO", "conducta_detalle": "HURTO A PERSONAS"},
            {"id_origen": 3, "lat": 7.1180, "lng": -73.1268, "categoria": "Robo", "ano": 2021, "mes": 6, "dia": 12, "dia_semana": "Miércoles", "comuna": "CENTRO", "barrio": "CENTRO", "conducta_detalle": "LESIONES PERSONALES"},
            {"id_origen": 4, "lat": 7.1183, "lng": -73.1263, "categoria": "Hurto", "ano": 2021, "mes": 6, "dia": 13, "dia_semana": "Jueves", "comuna": "CENTRO", "barrio": "CENTRO", "conducta_detalle": "HURTO A PERSONAS"},
            {"id_origen": 5, "lat": 7.1181, "lng": -73.1265, "categoria": "Acoso", "ano": 2021, "mes": 7, "dia": 14, "dia_semana": "Viernes", "comuna": "CENTRO", "barrio": "CENTRO", "conducta_detalle": "ACOSO SEXUAL"},
            {"id_origen": 6, "lat": 7.0865, "lng": -73.1165, "categoria": "Robo", "ano": 2021, "mes": 8, "dia": 15, "dia_semana": "Sábado", "comuna": "PROVENZA", "barrio": "PROVENZA", "conducta_detalle": "HOMICIDIO"},
        ])

    def test_parse_coordinate_latitude_valid(self):
        """Verifica la normalización de cadenas de latitud complejas de exportación."""
        self.assertAlmostEqual(parse_coordinate_latitude("7,170,557,382"), 7.170557382, places=6)
        self.assertAlmostEqual(parse_coordinate_latitude("715,135,927"), 7.15135927, places=6)
        self.assertAlmostEqual(parse_coordinate_latitude("7,120,645,358"), 7.120645358, places=6)

    def test_parse_coordinate_latitude_invalid(self):
        """Verifica descarte de placeholders y nulos."""
        self.assertTrue(np.isnan(parse_coordinate_latitude("xx.xxxx")))
        self.assertTrue(np.isnan(parse_coordinate_latitude(None)))
        self.assertTrue(np.isnan(parse_coordinate_latitude("")))

    def test_parse_coordinate_longitude_valid(self):
        """Verifica la normalización de cadenas de longitud complejas de exportación."""
        self.assertAlmostEqual(parse_coordinate_longitude("-73,135,108"), -73.135108, places=6)
        self.assertAlmostEqual(parse_coordinate_longitude("-7,312,605"), -73.12605, places=5)
        self.assertAlmostEqual(parse_coordinate_longitude("-73,145,704,583"), -73.145704583, places=6)

    def test_parse_coordinate_longitude_invalid(self):
        """Verifica descarte de placeholders en longitud."""
        self.assertTrue(np.isnan(parse_coordinate_longitude("-yy.yyyy")))
        self.assertTrue(np.isnan(parse_coordinate_longitude(None)))

    def test_geospatial_clustering(self):
        """Verifica que DBSCAN detecte la concentración en el Centro y descarte ruido."""
        # Creamos suficientes puntos en el Centro para formar clúster con min_samples=4
        clusterer = GeospatialClusterer(eps_meters=200.0, min_samples=4)
        summary = clusterer.fit_and_summarize(self.sample_data)
        
        self.assertGreaterEqual(len(summary), 1)
        c0 = summary[0]
        self.assertIn("centro", c0)
        self.assertAlmostEqual(c0["centro"]["latitud"], 7.118, delta=0.01)
        self.assertAlmostEqual(c0["centro"]["longitud"], -73.126, delta=0.01)
        self.assertEqual(c0["categoria_predominante"], "Hurto")
        self.assertGreaterEqual(c0["cantidad_incidentes"], 4)

    def test_risk_classification(self):
        """Verifica la clasificación estadística en niveles Bajo, Medio o Alto."""
        clusters_dummy = [
            {"cluster_id": 0, "cantidad_incidentes": 150, "centro": {"latitud": 7.11, "longitud": -73.12}, "categoria_predominante": "Hurto"},
            {"cluster_id": 1, "cantidad_incidentes": 40, "centro": {"latitud": 7.10, "longitud": -73.11}, "categoria_predominante": "Robo"},
            {"cluster_id": 2, "cantidad_incidentes": 10, "centro": {"latitud": 7.09, "longitud": -73.10}, "categoria_predominante": "Acoso"}
        ]
        classifier = RiskClassifier(umbral_medio=35.0, umbral_alto=65.0)
        res = classifier.classify_clusters(clusters_dummy)
        
        self.assertEqual(len(res), 3)
        self.assertEqual(res[0]["nivel_riesgo"], "Alto")
        self.assertIn("puntuacion", res[0])
        self.assertIn("color_hex", res[0])
        self.assertIn("advertencia", res[0])

    def test_heatmap_generation(self):
        """Verifica que los puntos generados tengan formato [lat, lng, intensidad]."""
        res = HeatmapGenerator.generate_points(self.sample_data, max_points=10)
        self.assertEqual(res["tipo"], "heatmap_leaflet")
        self.assertEqual(len(res["puntos"]), len(self.sample_data))
        pt0 = res["puntos"][0]
        self.assertEqual(len(pt0), 3) # [lat, lng, weight]
        self.assertIsInstance(pt0[0], float)
        self.assertIsInstance(pt0[1], float)
        self.assertIsInstance(pt0[2], float)

    def test_temporal_analysis(self):
        """Verifica la agregación de estadísticas temporales."""
        stats = TemporalAnalyzer.analyze(self.sample_data)
        self.assertEqual(stats["total_analizados"], 6)
        self.assertIn("frecuencia_por_ano", stats)
        self.assertIn("frecuencia_por_dia_semana", stats)
        self.assertIn("frecuencia_por_categoria", stats)

    def test_poca_data_resilience(self):
        """Verifica que el agente no falle ni rompa cuando recibe dataset vacío o mínimo."""
        clusterer = GeospatialClusterer(min_samples=10)
        res = clusterer.fit_and_summarize(pd.DataFrame())
        self.assertEqual(res, [])

if __name__ == "__main__":
    unittest.main()
