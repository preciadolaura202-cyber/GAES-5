const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const { requireAuth, JWT_SECRET } = require("../middlewares/auth");
const { sendRecoveryCode } = require("../config/mailer");

const router = express.Router();

// Almacén temporal de códigos de recuperación (correo -> { codigo, expiraEn })
const recoveryCodes = new Map();
const RECOVERY_TTL_MS = 10 * 60 * 1000; // 10 minutos
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 * Registra un nuevo usuario con contraseña hasheada (bcrypt)
 */
router.post("/register", async (req, res) => {
  try {
    const { nombre, correo, clave, password } = req.body;

    const userPassword = clave || password;

    // 1. Validar campos requeridos
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: "El nombre es obligatorio." });
    }
    if (!correo || !correo.trim()) {
      return res.status(400).json({ error: "El correo es obligatorio." });
    }
    if (!userPassword || typeof userPassword !== "string") {
      return res.status(400).json({ error: "La contraseña es obligatoria." });
    }

    const cleanNombre = nombre.trim();
    const cleanCorreo = correo.trim().toLowerCase();

    // 2. Validar formato básico de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanCorreo)) {
      return res.status(400).json({ error: "El formato de correo no es válido." });
    }

    // 3. Validar longitud mínima de contraseña
    if (userPassword.length < 6) {
      return res.status(400).json({
        error: "La contraseña debe tener al menos 6 caracteres.",
      });
    }

    // 4. Verificar si el correo ya existe
    const [usuariosExistentes] = await pool.query(
      "SELECT id FROM usuarios WHERE correo = ? LIMIT 1",
      [cleanCorreo]
    );

    if (usuariosExistentes.length > 0) {
      return res.status(409).json({
        error: "El correo electrónico ya se encuentra registrado.",
      });
    }

    // 5. Hashear la contraseña con bcrypt (10 rounds)
    const saltRounds = 10;
    const clave_hash = await bcrypt.hash(userPassword, saltRounds);

    // 6. Insertar en MySQL
    const [resultado] = await pool.query(
      "INSERT INTO usuarios (nombre, correo, clave_hash) VALUES (?, ?, ?)",
      [cleanNombre, cleanCorreo, clave_hash]
    );

    // 7. Respuesta exitosa
    return res.status(201).json({
      mensaje: "Usuario registrado con éxito.",
      usuario: {
        id: resultado.insertId,
        nombre: cleanNombre,
        correo: cleanCorreo,
        fecha_registro: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error en /api/auth/register:", error);
    return res.status(500).json({
      error: "Error interno del servidor al procesar el registro.",
      detalle: error.message,
    });
  }
});

/**
 * POST /api/auth/login
 * Autentica usuario, valida hash y retorna JWT
 */
router.post("/login", async (req, res) => {
  try {
    const { correo, clave, password } = req.body;
    const userPassword = clave || password;

    // 1. Validar campos
    if (!correo || !correo.trim() || !userPassword) {
      return res.status(400).json({
        error: "Debes ingresar correo y contraseña.",
      });
    }

    const cleanCorreo = correo.trim().toLowerCase();

    // 2. Buscar al usuario en la base de datos
    const [usuarios] = await pool.query(
      "SELECT id, nombre, correo, clave_hash FROM usuarios WHERE correo = ? LIMIT 1",
      [cleanCorreo]
    );

    if (usuarios.length === 0) {
      // Mensaje genérico por seguridad (no revelar si existe el correo)
      return res.status(401).json({
        error: "Credenciales inválidas. Revisa tu correo o contraseña.",
      });
    }

    const usuario = usuarios[0];

    // 3. Comparar contraseña con el hash almacenado
    const coincide = await bcrypt.compare(userPassword, usuario.clave_hash);
    if (!coincide) {
      return res.status(401).json({
        error: "Credenciales inválidas. Revisa tu correo o contraseña.",
      });
    }

    // 4. Generar Token JWT con vigencia de 7 días
    const payload = {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "7d",
    });

    // 5. Responder con token y datos de usuario (sin hash)
    return res.json({
      mensaje: "Inicio de sesión exitoso.",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
      },
    });
  } catch (error) {
    console.error("Error en /api/auth/login:", error);
    return res.status(500).json({
      error: "Error interno del servidor al iniciar sesión.",
      detalle: error.message,
    });
  }
});

/**
 * POST /api/auth/recover
 * Envía un código de verificación de 6 dígitos al correo registrado
 */
router.post("/recover", async (req, res) => {
  try {
    const { correo } = req.body;

    if (!correo || !correo.trim()) {
      return res.status(400).json({ error: "El correo es obligatorio." });
    }

    const cleanCorreo = correo.trim().toLowerCase();

    if (!emailRegex.test(cleanCorreo)) {
      return res.status(400).json({ error: "El formato de correo no es válido." });
    }

    // Verificar que la cuenta exista
    const [usuarios] = await pool.query(
      "SELECT id, nombre FROM usuarios WHERE correo = ? LIMIT 1",
      [cleanCorreo]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({
        error: "No existe una cuenta registrada con ese correo electrónico.",
      });
    }

    // Generar código de 6 dígitos
    const codigo = String(crypto.randomInt(100000, 1000000));

    recoveryCodes.set(cleanCorreo, {
      codigo,
      expiraEn: Date.now() + RECOVERY_TTL_MS,
    });

    await sendRecoveryCode(cleanCorreo, codigo);

    return res.json({
      mensaje: "Código enviado. Revisa tu bandeja de entrada.",
      expiraEnMinutos: 10,
    });
  } catch (error) {
    console.error("Error en /api/auth/recover:", error);
    return res.status(500).json({
      error: "No se pudo enviar el código de recuperación.",
      detalle: error.message,
    });
  }
});

/**
 * POST /api/auth/recover/verify
 * Verifica el código y actualiza la contraseña del usuario
 */
router.post("/recover/verify", async (req, res) => {
  try {
    const { correo, codigo, nuevaClave, clave } = req.body;
    const newPassword = nuevaClave || clave;

    if (!correo || !correo.trim()) {
      return res.status(400).json({ error: "El correo es obligatorio." });
    }
    if (!codigo || !codigo.trim()) {
      return res.status(400).json({ error: "El código de verificación es obligatorio." });
    }
    if (!newPassword || typeof newPassword !== "string") {
      return res.status(400).json({ error: "La nueva clave es obligatoria." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "La nueva clave debe tener al menos 6 caracteres." });
    }

    const cleanCorreo = correo.trim().toLowerCase();
    const registro = recoveryCodes.get(cleanCorreo);

    if (!registro || registro.expiraEn < Date.now()) {
      recoveryCodes.delete(cleanCorreo);
      return res.status(400).json({
        error: "El código no existe o ha expirado. Solicita uno nuevo.",
      });
    }

    if (registro.codigo !== String(codigo).trim()) {
      return res.status(400).json({ error: "El código de verificación no coincide." });
    }

    // Actualizar contraseña hasheada
    const clave_hash = await bcrypt.hash(newPassword, 10);
    const [resultado] = await pool.query(
      "UPDATE usuarios SET clave_hash = ? WHERE correo = ?",
      [clave_hash, cleanCorreo]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: "No se encontró la cuenta a actualizar." });
    }

    recoveryCodes.delete(cleanCorreo);

    return res.json({ mensaje: "Clave restablecida con éxito." });
  } catch (error) {
    console.error("Error en /api/auth/recover/verify:", error);
    return res.status(500).json({
      error: "No se pudo restablecer la clave.",
      detalle: error.message,
    });
  }
});

/**
 * GET /api/auth/me
 * Endpoint protegido para validar token y devolver datos del usuario logueado
 */
router.get("/me", requireAuth, (req, res) => {
  // req.user proviene de la verificación del middleware requireAuth
  res.json({
    ok: true,
    usuario: req.user,
  });
});

module.exports = router;
