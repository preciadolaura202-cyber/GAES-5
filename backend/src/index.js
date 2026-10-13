const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { checkDatabaseConnection } = require("./config/db");
const categoriasRouter = require("./routes/categorias");
const authRouter = require("./routes/auth");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ruta de comprobación de salud
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    servicio: "SegurIA API",
    fecha: new Date().toISOString(),
  });
});

// Rutas de la API
app.use("/api/categorias", categoriasRouter);
app.use("/api/auth", authRouter);

app.listen(PORT, async () => {
  console.log(`SegurIA API escuchando en http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`Categorías: http://localhost:${PORT}/api/categorias`);
  console.log(`Registro: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`Recuperar clave: POST http://localhost:${PORT}/api/auth/recover`);
  await checkDatabaseConnection();
});

