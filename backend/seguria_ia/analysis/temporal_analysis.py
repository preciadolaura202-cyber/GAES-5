"""
SegurIA — Módulo de Análisis Temporal y Estadístico de Incidentes
Proyecto: SegurIA (GAES-5)
Propósito: Extraer métricas de frecuencia temporal (años, meses, días de la semana)
           y evolución cronológica de los reportes.
"""

from typing import Dict, Any, List
import pandas as pd

class TemporalAnalyzer:
    """
    Analiza patrones temporales y evolutivos en el conjunto de datos de incidentes.
    """

    @staticmethod
    def analyze(df: pd.DataFrame) -> Dict[str, Any]:
        if df.empty:
            return {
                "total_analizados": 0,
                "por_ano": {},
                "por_mes": {},
                "por_dia_semana": {},
                "categoria_por_ano": {},
                "dia_con_mas_incidentes": None
            }

        # 1. Distribución por año
        por_ano = df["ano"].value_counts().sort_index().to_dict()

        # 2. Distribución por mes
        meses_nombres = {
            1: "Enero", 2: "Febrero", 3: "Marzo", 4: "Abril",
            5: "Mayo", 6: "Junio", 7: "Julio", 8: "Agosto",
            9: "Septiembre", 10: "Octubre", 11: "Noviembre", 12: "Diciembre"
        }
        mes_counts = df["mes"].value_counts().sort_index()
        por_mes = {meses_nombres.get(int(k), f"Mes {k}"): int(v) for k, v in mes_counts.items()}

        # 3. Distribución por día de la semana
        por_dia_semana = df["dia_semana"].value_counts().to_dict()

        # Día con mayor volumen
        dia_pico = df["dia_semana"].mode().iloc[0] if not df["dia_semana"].empty else "N/A"

        # 4. Distribución por categoría general
        por_categoria = df["categoria"].value_counts().to_dict()

        # 5. Evolución anual de categorías principales
        cross_ano_cat = pd.crosstab(df["ano"], df["categoria"]).to_dict(orient="index")

        return {
            "total_analizados": len(df),
            "rango_anos": {
                "desde": int(df["ano"].min()),
                "hasta": int(df["ano"].max())
            },
            "frecuencia_por_ano": {str(k): int(v) for k, v in por_ano.items()},
            "frecuencia_por_mes": por_mes,
            "frecuencia_por_dia_semana": {str(k): int(v) for k, v in por_dia_semana.items()},
            "frecuencia_por_categoria": {str(k): int(v) for k, v in por_categoria.items()},
            "evolucion_anual_categoria": {str(ano): {str(cat): int(val) for cat, val in cats.items()} for ano, cats in cross_ano_cat.items()},
            "dia_mayor_concentracion": dia_pico,
            "observaciones_horarias": (
                "El dataset gubernamental de Bucaramanga no incluye columna de hora exacta "
                "(HH:MM:SS) en sus registros abiertos. El análisis temporal se consolida a nivel de "
                "año, mes, día y día de la semana."
            )
        }
