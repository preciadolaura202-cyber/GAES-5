"""
SegurIA — Módulo de Integración con MySQL
Proyecto: SegurIA (GAES-5)
Propósito: Conectar el agente de Inteligencia Artificial con la base de datos MySQL existente
           para fusionar reportes de la comunidad con datos históricos y persistir análisis.
"""

import os
import sys
import json
import logging
from typing import List, Dict, Any, Optional
import pandas as pd

# Asegurar importación del database.py del backend
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(os.path.dirname(current_dir))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

try:
    from database import get_db_connection
    MYSQL_AVAILABLE = True
except ImportError:
    MYSQL_AVAILABLE = False

logger = logging.getLogger("SegurIA_DB_Integration")

class DatabaseIntegration:
    """
    Gestiona la lectura de nuevos reportes de ciudadanos en MySQL
    y la persistencia de resultados del agente IA.
    """

    @staticmethod
    def get_live_reports() -> pd.DataFrame:
        """
        Consulta los reportes ciudadanos registrados en la tabla 'resenas' de MySQL.
        Retorna un DataFrame homologado con las columnas estándar de SegurIA.
        """
        if not MYSQL_AVAILABLE:
            return pd.DataFrame()

        try:
            conn = get_db_connection(use_database=True)
            with conn.cursor() as cursor:
                sql = """
                    SELECT 
                        r.id AS id_origen,
                        r.titulo,
                        r.descripcion,
                        r.latitud AS lat,
                        r.longitud AS lng,
                        r.fecha,
                        c.nombre AS categoria,
                        u.nombre AS autor
                    FROM resenas r
                    JOIN categorias c ON r.categoria_id = c.id
                    JOIN usuarios u ON r.usuario_id = u.id
                    ORDER BY r.fecha DESC;
                """
                cursor.execute(sql)
                rows = cursor.fetchall()
            conn.close()

            if not rows:
                return pd.DataFrame()

            df_live = pd.DataFrame(rows)
            # Homologar tipos
            df_live["lat"] = pd.to_numeric(df_live["lat"], errors="coerce")
            df_live["lng"] = pd.to_numeric(df_live["lng"], errors="coerce")
            df_live = df_live.dropna(subset=["lat", "lng"])

            # Extraer campos de fecha
            df_live["fecha_dt"] = pd.to_datetime(df_live["fecha"], errors="coerce")
            df_live["ano"] = df_live["fecha_dt"].dt.year.fillna(2026).astype(int)
            df_live["mes"] = df_live["fecha_dt"].dt.month.fillna(1).astype(int)
            df_live["dia"] = df_live["fecha_dt"].dt.day.fillna(1).astype(int)
            
            dias_semana_esp = {0: "Lunes", 1: "Martes", 2: "Miércoles", 3: "Jueves", 4: "Viernes", 5: "Sábado", 6: "Domingo"}
            df_live["dia_semana"] = df_live["fecha_dt"].dt.weekday.map(dias_semana_esp).fillna("Desconocido")
            
            df_live["comuna"] = "Comunidad SegurIA"
            df_live["barrio"] = "Reporte Ciudadano"
            df_live["conducta_detalle"] = df_live["titulo"]
            df_live["arma_medio"] = "No especificado"

            return df_live
        except Exception as err:
            logger.warning(f"No se pudieron cargar reportes en vivo de MySQL (modo offline activo): {err}")
            return pd.DataFrame()

    @staticmethod
    def save_analysis_results(clusters: List[Dict[str, Any]], duracion_segundos: float = 0.0) -> bool:
        """
        Opcionalmente guarda las agrupaciones de riesgo en las tablas de IA de MySQL.
        """
        if not MYSQL_AVAILABLE or not clusters:
            return False

        try:
            conn = get_db_connection(use_database=True)
            with conn.cursor() as cursor:
                # 1. Asegurar tablas
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS ia_zonas_riesgo (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        cluster_id INT NOT NULL,
                        sector_nombre VARCHAR(150) NOT NULL,
                        comuna VARCHAR(100) DEFAULT '',
                        latitud DECIMAL(10, 8) NOT NULL,
                        longitud DECIMAL(11, 8) NOT NULL,
                        radio_metros DECIMAL(8, 2) DEFAULT 0.0,
                        cantidad_incidentes INT NOT NULL DEFAULT 0,
                        categoria_predominante VARCHAR(50) NOT NULL,
                        nivel_riesgo ENUM('Bajo', 'Medio', 'Alto') NOT NULL,
                        puntuacion INT NOT NULL DEFAULT 0,
                        fecha_analisis TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                """)

                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS ia_analisis_logs (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        total_incidentes INT NOT NULL,
                        total_clusters INT NOT NULL,
                        algoritmo VARCHAR(50) NOT NULL,
                        parametros_json TEXT,
                        duracion_segundos DECIMAL(6, 3) DEFAULT 0.0
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                """)

                # 2. Limpiar zonas anteriores e insertar las calculadas
                cursor.execute("TRUNCATE TABLE ia_zonas_riesgo;")
                sql_insert = """
                    INSERT INTO ia_zonas_riesgo (
                        cluster_id, sector_nombre, comuna, latitud, longitud,
                        radio_metros, cantidad_incidentes, categoria_predominante,
                        nivel_riesgo, puntuacion
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """
                for c in clusters:
                    cursor.execute(sql_insert, (
                        c["cluster_id"],
                        c.get("sector_nombre", "Sector Urbano"),
                        c.get("comuna", ""),
                        c["centro"]["latitud"],
                        c["centro"]["longitud"],
                        c.get("radio_metros", 0.0),
                        c["cantidad_incidentes"],
                        c["categoria_predominante"],
                        c["nivel_riesgo"],
                        c["puntuacion"]
                    ))

                # 3. Log de ejecución
                cursor.execute("""
                    INSERT INTO ia_analisis_logs (total_incidentes, total_clusters, algoritmo, parametros_json, duracion_segundos)
                    VALUES (%s, %s, %s, %s, %s);
                """, (
                    sum(c["cantidad_incidentes"] for c in clusters),
                    len(clusters),
                    "DBSCAN_Haversine_P90",
                    json.dumps({"eps_m": 300, "min_samples": 20}),
                    duracion_segundos
                ))
            conn.close()
            return True
        except Exception as err:
            logger.warning(f"No se pudieron persistir resultados en MySQL: {err}")
            return False
