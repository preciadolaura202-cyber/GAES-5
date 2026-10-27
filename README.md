# SegurIA — GAES-5 (SENA)

**Plataforma colaborativa de seguridad urbana:** los ciudadanos reportan y consultan zonas de riesgo en tiempo real mediante reseñas geolocalizadas, alertas de la comunidad y un mapa interactivo.

> Proyecto académico (hackathon) — Equipo **GAES-5**.

---

## 👥 Equipo y roles

| Integrante | Rol | Responsable de |
|-----------|-----|----------------|
| Laura Quiroz | ⚙️ DevOps | Repo, Git, CI/CD, despliegue |
| Johan Sanchez | 🎨 Frontend | Interfaz, estilos, interacción |
| Kaleth García | 🔧 Backend | Servidor, API, lógica + BD |
| Jorlan Hernandez | 🧭 PM | Canal con el cliente, QA, entregas |
| Julian Monsalve | 🧩 Full | Apoyo en Frontend/Backend |

---

## 📋 El proceso del proyecto

El proyecto se construyó siguiendo el plan de trabajo del curso, por etapas:

### 1. Inscripción y requerimientos (Clase 06)
- Definición de identidad del equipo, visión, alcance y roles.
- Elaboración de `PLANTILLA-REQUERIMIENTOS.md` como contrato con el "cliente" (instructor).
- Se definió el **MVP** y la **feature clave**: reportes ciudadanos en tiempo real con reseñas geolocalizadas.

### 2. Diseño de producto y experiencia (Frontend)
- Definición del producto en `frontend/readme.md`: propósito, usuarios, capacidades y restricciones.
- Design system completo en `frontend/DESIGN.md`: paleta (obsidiana + señalética táctica), tipografía (Archivo / Chivo Mono), layout en tres estratos, reglas de accesibilidad WCAG 2.1 AA y componentes.
- Interfaz de login como "consola situacional": mapa táctico en canvas con radar, medidor de entropía de contraseña, modal biométrico y despacho de emergencia.
- Stack frontend: **HTML5 semántico + CSS3 moderno + TypeScript** (compilado a `dist/`), sin dependencias externas.

### 3. Backend y API (Clases 07–08)
- Servidor **Node.js + Express** con CORS y JSON.
- Rutas de salud y recursos: `/health`, `/api/categorias`, `/api/auth`.
- Estructura modular: `routes/`, `middlewares/`, `config/`.

### 4. Datos y persistencia (Clases 09–10)
- Base de datos **MySQL** (`backend/database/schema.sql`):
  - `usuarios` — nombre, correo único, hash de contraseña, fecha de registro.
  - `categorias` — tipos de incidente (Robo, Acoso, Hurto, Vandalismo, Otro) con datos semilla.
  - `resenas` — título, descripción, categoría, latitud/longitud, fecha; con relaciones foráneas a usuario y categoría.

### 5. Autenticación (Clases 11–13)
- Registro con validación de campos, correo y longitud mínima de contraseña.
- Contraseñas hasheadas con **bcrypt** (10 rounds).
- Login con **JWT** (vigencia 7 días) y middleware `requireAuth` para rutas protegidas.
- Endpoint `GET /api/auth/me` para verificar el token.

### 6. Integración y despliegue (Clases 14–16)
- Unión de frontend y backend.
- Despliegue planificado: **Vercel** (frontend), **Render** (backend), MySQL en **Railway**.
- CI/CD con despliegue automático en cada push (GitHub Actions).

---

## 🗂 Estructura del proyecto

```
GAES-5-main/
├── backend-python/           # API Python (FastAPI) + MySQL (phpMyAdmin)
│   ├── database.py           # Conexión MySQL y creación automática de tablas
│   ├── security.py           # Hash con Bcrypt y autenticación JWT
│   ├── schema.sql            # Esquema y semillas de la BD para phpMyAdmin
│   ├── main.py               # Servidor FastAPI, CORS y Swagger (/docs)
│   ├── init_db.py            # Inicializador de base de datos
│   ├── requirements.txt      # Dependencias Python
│   ├── routes/
│   │   ├── auth.py           # Registro en MySQL, Login y JWT
│   │   ├── categorias.py     # Listado de categorías
│   │   └── reportes.py       # Creación y listado de reportes
│   └── .env
├── frontend/                 # Frontend (interfaz comunitaria)
│   ├── login.html            # Inicio de sesión
│   ├── register.html         # Formulario de registro conectado a MySQL
│   ├── dashboard.html        # Panel principal
│   ├── crear-reporte.html    # Formulario para publicar incidentes
│   ├── reportes.html         # Listado y filtros de reportes
│   ├── mapa.html             # Mapa táctico Leaflet
│   ├── styles.css
│   ├── js/                   # Controladores JavaScript
│   ├── DESIGN.md             # Design system
│   ├── readme.md             # Definición de producto
│   └── PLANTILLA-REQUERIMIENTOS.md
├── iniciar-backend.bat       # Script para iniciar el servidor Python con 1 clic
└── README.md
```

---

## 🚀 Cómo ejecutar

### Requisitos
- Python 3.13 (disponible en Laragon)
- MySQL / phpMyAdmin (Laragon o XAMPP local en el puerto 3306)

### 1. Iniciar Base de datos MySQL
Inicia el servicio MySQL en **Laragon** (hacer clic en *Iniciar Todo*) o en **XAMPP**.
La base de datos y sus tablas se crean automáticamente al iniciar el servidor backend.

### 2. Iniciar el Backend en Python
Simplemente ejecuta:
```cmd
iniciar-backend.bat
```
O manualmente desde la terminal:
```powershell
cd backend-python
.\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
La API quedará disponible en `http://127.0.0.1:8000` (Swagger docs: `http://127.0.0.1:8000/docs`).

### 3. Frontend
Abrir `frontend/login.html` en el navegador, o servirlo con cualquier servidor estático:
```bash
cd frontend
npx serve .
```

---

## 🔌 API

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/health` | Estado del servicio | No |
| GET | `/api/categorias` | Lista de categorías | No |
| POST | `/api/auth/register` | Registro de usuario | No |
| POST | `/api/auth/login` | Inicio de sesión (devuelve JWT) | No |
| POST | `/api/auth/recover` | Envía código de recuperación al correo | No |
| POST | `/api/auth/recover/verify` | Verifica código y restablece la clave | No |
| GET | `/api/auth/me` | Datos del usuario logueado | Sí (Bearer) |

**Ejemplo de login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"user@test.com","clave":"secret123"}'
```

---

## 🗺 Alcance del MVP

**Dentro del MVP:**
- ✅ Registro e inicio de sesión
- ✅ Publicar y ver reseñas en tiempo real
- ✅ Mapa con zonas reportadas
- ✅ Sistema de categorías de incidentes

**Extras (pendientes):**
- 👤 Perfil de usuario
- ⭐ Calificación de utilidad de reseñas
- 📊 Estadísticas de zonas más reportadas

---

## 🛠 Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 semántico, CSS3, TypeScript |
| Backend | Node.js + Express |
| Base de datos | MySQL |
| Autenticación | JWT + bcrypt |
| Mapa (planificado) | Leaflet + OpenStreetMap |
| Tiempo real (planificado) | Socket.IO |
| Despliegue | Vercel (FE), Render (BE), Railway (BD) |

---

## 📅 Plan de trabajo

| Clases | Objetivo |
|--------|----------|
| 07–08 | Servidor + API base |
| 09–10 | Persistencia (BD, usuarios y reseñas) |
| 11–13 | Auth + tiempo real (Socket.IO) + reportes |
| 14–15 | Integración + despliegue |
| 16 | Demo lista y ensayada |
