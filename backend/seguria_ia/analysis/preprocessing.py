"""
SegurIA — Módulo de Preprocesamiento y Limpieza de Datos Geoespaciales
Proyecto: SegurIA (GAES-5)
Propósito: Normalizar, limpiar y validar registros históricos de incidentes
           de Bucaramanga y Santander garantizando integridad geográfica y privacidad.
"""

import os
import re
import json
import logging
from typing import Dict, Any, Tuple
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("SegurIA_Preprocessing")

# Límites geográficos para Bucaramanga y su Área Metropolitana / Santander
GEO_BOUNDS = {
    "lat_min": 6.95,
    "lat_max": 7.35,
    "lng_min": -73.40,
    "lng_max": -72.95
}

# Mapeo de categorías del dataset oficial hacia las categorías estándar de SegurIA
CATEGORIA_MAPPING = {
    "HURTO A PERSONAS": "Hurto",
    "HURTO A ENTIDADES COMERCIALES": "Hurto",
    "HURTO A RESIDENCIAS": "Hurto",
    "HURTO A MOTOCICLETAS": "Hurto",
    "HURTO A AUTOMOTORES": "Hurto",
    "HURTO A ENTIDADES FINANCIERAS": "Hurto",
    "LESIONES PERSONALES": "Robo",
    "HOMICIDIO": "Robo",
    "EXTORSIÓN": "Robo",
    "EXTORSION": "Robo",
    "PIRATERIA": "Robo",
    "ACOSO SEXUAL": "Acoso",
    "ACTO SEXUAL VIOLENTO": "Acoso",
    "ACTOS SEXUALES CON MENOR DE 14 AÑOS": "Acoso",
    "ACCESO CARNAL VIOLENTO": "Acoso",
    "ACCESO CARNAL ABUSIVO CON MENOR DE 14 AÑOS": "Acoso",
    "INDUCIMIENTO A LA PROSTITUCION": "Acoso",
    "PORNOGRAFIA CON MENORES": "Acoso",
    "DAÑO EN BIEN AJENO": "Vandalismo",
    "INCENDIO": "Vandalismo",
    "VIOLENCIA INTRAFAMILIAR": "Otro",
    "LESIONES CULPOSAS ( EN ACCIDENTE DE TRANSITO )": "Otro",
    "HOMICIDIO CULPOSO ( EN ACCIDENTE DE TRÁNSITO)": "Otro",
    "NO REPORTA": "Otro"
}

def parse_coordinate_latitude(val: Any) -> float:
    """
    Convierte cadenas con formato de exportación de base de datos o comas decimales
    (ej: '7,170,557,382' o '715,135,927') a valor decimal estándar (7.170557...).
    Retorna np.nan si el dato es nulo, placeholder ('xx.xxxx') o inválido.
    """
    if pd.isna(val):
        return np.nan
    s = str(val).strip()
    if "xx" in s.lower() or not s:
        return np.nan
    
    digits = re.sub(r"[^0-9]", "", s)
    if not digits:
        return np.nan
    
    # Latitud en Bucaramanga inicia con 7
    if digits.startswith("7") and len(digits) > 1:
        return float(digits[0] + "." + digits[1:])
    return np.nan

def parse_coordinate_longitude(val: Any) -> float:
    """
    Convierte cadenas con formato de exportación de base de datos o comas decimales
    (ej: '-73,135,108' o '-7,312,605') a valor decimal estándar (-73.135108).
    Retorna np.nan si el dato es nulo, placeholder ('-yy.yyyy') o inválido.
    """
    if pd.isna(val):
        return np.nan
    s = str(val).strip()
    if "yy" in s.lower() or not s:
        return np.nan
    
    digits = re.sub(r"[^0-9]", "", s)
    if not digits:
        return np.nan
    
    # Longitud en Bucaramanga / Santander inicia con 73 (o 72/74)
    if (digits.startswith("73") or digits.startswith("72") or digits.startswith("74")) and len(digits) > 2:
        return -float(digits[:2] + "." + digits[2:])
    return np.nan

def clean_incidents_data(
    input_path: str,
    output_path: str,
    save_cleaned: bool = True
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Ejecuta el pipeline completo de limpieza y transformación de incidentes.
    Conserva el archivo original y genera una copia procesada verificada.
    """
    logger.info(f"Iniciando lectura de datos desde: {input_path}")
    df_raw = pd.read_csv(input_path, encoding="utf-8", low_memory=False)
    total_registros = len(df_raw)
    
    reporte_calidad = {
        "archivo_origen": os.path.basename(input_path),
        "total_registros_iniciales": total_registros,
        "columnas_detectadas": df_raw.columns.tolist(),
        "duplicados_detectados": int(df_raw.drop(columns=["ORDEN"], errors="ignore").duplicated().sum()),
        "nulos_por_columna": df_raw.isnull().sum().to_dict(),
        "coordenadas_invalidas_placeholder": 0,
        "coordenadas_fuera_de_rango": 0,
        "registros_finales_validos": 0,
        "porcentaje_utilidad": 0.0
    }
    
    # 1. Normalizar coordenadas
    lats = df_raw["LATITUD"].apply(parse_coordinate_latitude)
    lngs = df_raw["LONGITUD"].apply(parse_coordinate_longitude)
    
    coordenadas_validas_mask = lats.notna() & lngs.notna()
    reporte_calidad["coordenadas_invalidas_placeholder"] = int((~coordenadas_validas_mask).sum())
    
    df_clean = df_raw[coordenadas_validas_mask].copy()
    df_clean["lat"] = lats[coordenadas_validas_mask]
    df_clean["lng"] = lngs[coordenadas_validas_mask]
    
    # 2. Filtrar delimitación territorial (Bucaramanga y área metropolitana)
    dentro_rango = (
        (df_clean["lat"] >= GEO_BOUNDS["lat_min"]) &
        (df_clean["lat"] <= GEO_BOUNDS["lat_max"]) &
        (df_clean["lng"] >= GEO_BOUNDS["lng_min"]) &
        (df_clean["lng"] <= GEO_BOUNDS["lng_max"])
    )
    reporte_calidad["coordenadas_fuera_de_rango"] = int((~dentro_rango).sum())
    df_clean = df_clean[dentro_rango].copy()
    
    # 3. Eliminar duplicados
    df_clean = df_clean.drop_duplicates(subset=["lat", "lng", "ANO", "MES", "DIA", "CONDUCTA"])
    
    # 4. Mapear categorías
    df_clean["categoria_seguria"] = df_clean["CONDUCTA"].str.strip().map(
        lambda c: CATEGORIA_MAPPING.get(c, "Otro")
    )
    
    # 5. Estandarizar fechas
    def parse_mes(mes_str):
        if pd.isna(mes_str):
            return 1
        m = re.search(r"(\d+)", str(mes_str))
        return int(m.group(1)) if m else 1

    df_clean["mes_num"] = df_clean["MES"].apply(parse_mes)
    df_clean["dia_num"] = pd.to_numeric(df_clean["DIA"], errors="coerce").fillna(1).astype(int)
    df_clean["ano_num"] = pd.to_numeric(df_clean["ANO"], errors="coerce").fillna(2020).astype(int)
    
    # 6. Estandarizar Comuna y Barrio
    df_clean["comuna"] = df_clean["NOM_COMUNA"].str.strip()
    df_clean["barrio"] = df_clean["BARRIOS_HECHO"].str.strip()
    
    # 7. Mantener columnas esenciales para el análisis y frontend (sin datos privados/personales)
    cols_seleccionadas = [
        "ORDEN",
        "ano_num",
        "mes_num",
        "dia_num",
        "DIA_SEMANA",
        "comuna",
        "barrio",
        "lat",
        "lng",
        "categoria_seguria",
        "CONDUCTA",
        "ARMAS_MEDIOS"
    ]
    df_final = df_clean[cols_seleccionadas].rename(columns={
        "ORDEN": "id_origen",
        "ano_num": "ano",
        "mes_num": "mes",
        "dia_num": "dia",
        "DIA_SEMANA": "dia_semana",
        "categoria_seguria": "categoria",
        "CONDUCTA": "conducta_detalle",
        "ARMAS_MEDIOS": "arma_medio"
    })
    
    registros_validos = len(df_final)
    reporte_calidad["registros_finales_validos"] = registros_validos
    reporte_calidad["porcentaje_utilidad"] = round((registros_validos / total_registros) * 100, 2)
    
    if save_cleaned and output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        df_final.to_csv(output_path, index=False, encoding="utf-8")
        logger.info(f"Dataset limpio guardado exitosamente en: {output_path} ({registros_validos} registros)")
        
        # Guardar reporte de calidad
        report_path = os.path.splitext(output_path)[0] + "_calidad_reporte.json"
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(reporte_calidad, f, indent=2, ensure_ascii=False)
            
    return df_final, reporte_calidad

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    input_file = os.path.join(base_dir, "data", "original", "Delitos_ocurridos_en_el_Municipio_de_Bucaramanga_20250403.csv")
    output_file = os.path.join(base_dir, "data", "processed", "delitos_bucaramanga_limpio.csv")
    
    df_res, rep = clean_incidents_data(input_file, output_file)
    print("\n=== RESUMEN DE PREPROCESAMIENTO ===")
    print(json.dumps(rep, indent=2, ensure_ascii=False))
