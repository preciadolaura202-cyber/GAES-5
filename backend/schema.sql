-- =======================================================
-- Proyecto: SegurIA (GAES-5)
-- Base de datos y tablas iniciales para phpMyAdmin / MySQL
-- =======================================================

CREATE DATABASE IF NOT EXISTS seguria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE seguria;

-- 1. Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  clave_hash VARCHAR(255) NOT NULL,
  rol ENUM('usuario', 'administrador', 'desarrollador') DEFAULT 'usuario',
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabla: categorias
CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabla: resenas
CREATE TABLE IF NOT EXISTS resenas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  categoria_id INT NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descripcion TEXT NOT NULL,
  latitud DECIMAL(10, 8) NOT NULL,
  longitud DECIMAL(11, 8) NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_resenas_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT fk_resenas_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- =======================================================
-- Datos Semilla (Seeds)
-- =======================================================
INSERT INTO categorias (nombre) VALUES 
  ('Robo'),
  ('Acoso'),
  ('Hurto'),
  ('Vandalismo'),
  ('Otro')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Usuario Administrador por defecto (clave: admin1234)
INSERT INTO usuarios (nombre, correo, clave_hash, rol)
SELECT 'Administrador General', 'admin@seguria.org', '$2b$10$vN0oVwGgJ5mF2n3A8k6mEetJp6R5eT6dM1V8mZ4o9Y7wX2qL1aK0e', 'administrador'
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE correo = 'admin@seguria.org');
