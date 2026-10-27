# SegurIA — Backend en Python (FastAPI + MySQL / phpMyAdmin)

API RESTful desarrollada en **Python (FastAPI)** para la plataforma comunitaria **SegurIA (GAES-5)**, conectada a base de datos **MySQL** administrable a través de **phpMyAdmin** (Laragon o XAMPP).

---

## 🚀 Arquitectura y Tecnologías

- **Lenguaje:** Python 3.13
- **Framework Web:** FastAPI (con validación de tipos mediante Pydantic)
- **Servidor ASGI:** Uvicorn
- **Base de Datos:** MySQL / MariaDB (accedida mediante phpMyAdmin)
- **Conector MySQL:** PyMySQL + Cryptography
- **Seguridad y Cifrado:** Bcrypt (hashing de contraseñas con salt)
- **Autenticación:** Tokens JWT (JSON Web Tokens)

---

## 🗄️ Estructura de la Base de Datos (`seguria`)

La base de datos se crea automáticamente al iniciar el servidor o al ejecutar `python init_db.py`:

1. **`usuarios`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `nombre`: VARCHAR(100)
   - `correo`: VARCHAR(150) UNIQUE
   - `clave_hash`: VARCHAR(255) (Bcrypt)
   - `rol`: ENUM('usuario', 'administrador', 'desarrollador')
   - `fecha_registro`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

2. **`categorias`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `nombre`: VARCHAR(50) UNIQUE (`Robo`, `Acoso`, `Hurto`, `Vandalismo`, `Otro`)

3. **`resenas`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `usuario_id`: Clave foránea a `usuarios(id)`
   - `categoria_id`: Clave foránea a `categorias(id)`
   - `titulo`, `descripcion`, `latitud`, `longitud`, `fecha`

---

## ⚙️ Pasos para Iniciar el Sistema

### 1. Iniciar MySQL (Laragon o XAMPP)
- Abre **Laragon** y pulsa **"Iniciar todo"** (o en **XAMPP** inicia el módulo **MySQL**).
- Abre tu navegador en [http://localhost/phpmyadmin](http://localhost/phpmyadmin) para verificar que phpMyAdmin esté accesible.

### 2. Iniciar el Servidor Backend en Python
Puedes iniciarlo de dos formas:

- **Opción A (Recomendada con un clic):**
  Haz doble clic en el archivo `iniciar-backend.bat` en la raíz del proyecto.

- **Opción B (Desde la terminal):**
  ```powershell
  cd "backend"
  .\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
  ```

---

## 🛡️ Cuenta de Administrador Preconfigurada

La base de datos ya incluye un usuario con **rol administrador** listo para iniciar sesión:

- **Correo electrónico:** `admin@seguria.org`
- **Contraseña:** `admin1234`
- **Rol en base de datos:** `administrador`

En la pantalla de inicio de sesión (`frontend/login.html`) puedes pulsar el botón **"Autocompletar"** para rellenar estos datos de inmediato o escribirlos manualmente. Al ingresar, el panel y la barra lateral reconocerán automáticamente el rol de **Administrador General**.

### 3. Probar el Registro desde el Frontend
1. Abre `frontend/register.html` en el navegador (o con Live Server).
2. Llena el nombre, correo electrónico y contraseña.
3. Al presionar **"Crear cuenta"**, los datos se envían a `http://127.0.0.1:8000/api/auth/register`.
4. El servidor cifra la contraseña con Bcrypt y guarda el registro en la tabla `usuarios` de MySQL.
5. Abre **phpMyAdmin** en [http://localhost/phpmyadmin](http://localhost/phpmyadmin), entra a la base de datos `seguria` y selecciona la tabla `usuarios`: verás el nuevo usuario registrado con su contraseña cifrada.

---

## 📡 Endpoints Disponibles

- `GET /health` — Comprobación de salud y estado de la conexión a MySQL
- `GET /docs` — Documentación interactiva Swagger
- `POST /api/auth/register` — Registro de usuarios en base de datos
- `POST /api/auth/login` — Inicio de sesión con verificación de contraseña y retorno de JWT
- `GET /api/auth/me` — Perfil del usuario autenticado (requiere `Authorization: Bearer <token>`)
- `POST /api/auth/recover` — Solicitud de código de recuperación de contraseña
- `POST /api/auth/recover/verify` — Restablecimiento de contraseña
- `GET /api/categorias` — Listado de categorías de incidentes
- `GET /api/reportes` — Listado de reportes en la base de datos
- `POST /api/reportes` — Creación de un nuevo reporte ciudadano
