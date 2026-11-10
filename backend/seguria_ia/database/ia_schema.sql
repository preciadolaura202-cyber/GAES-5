-- =======================================================
-- Módulo de Inteligencia Artificial Geoespacial para SegurIA
-- Tablas opcionales para persistir resultados del agente IA
-- =======================================================

USE seguria;

-- 1. Tabla de zonas y clusters calculados por el agente IA
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

-- 2. Tabla de auditoría y bitácora de ejecuciones del análisis
CREATE TABLE IF NOT EXISTS ia_analisis_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_incidentes INT NOT NULL,
    total_clusters INT NOT NULL,
    algoritmo VARCHAR(50) NOT NULL,
    parametros_json TEXT,
    duracion_segundos DECIMAL(6, 3) DEFAULT 0.0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
