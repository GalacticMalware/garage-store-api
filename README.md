# Garage Storage API

API REST en TypeScript para **almacenar imágenes (Base64) en [Garage](https://garagehq.deuxfleurs.fr/)** (S3 compatible, self-hosted) con autenticación JWT y registro de las subidas en **MySQL**.

- 🔐 Autenticación con JWT (expiración corta, configurable)
- 🖼️ Subida de imágenes en Base64 a un bucket de Garage
- 🗄️ Persistencia de la URL, el nombre y el usuario que subió cada imagen
- ✅ Validación estricta de payloads con Zod
- 🧱 Arquitectura por capas, preparada para crecer
- 🚀 Despliegue con PM2 + Nginx

---

## Tabla de contenidos

- [Arquitectura](#arquitectura)
- [Cómo funciona](#cómo-funciona)
- [Requisitos](#requisitos)
- [Instalación de Garage](#instalación-de-garage)
- [Configuración de la base de datos](#configuración-de-la-base-de-datos)
- [Variables de entorno](#variables-de-entorno)
- [Uso en desarrollo](#uso-en-desarrollo)
- [Endpoints](#endpoints)
- [Códigos de respuesta](#códigos-de-respuesta)
- [Despliegue en producción (PM2 + Nginx)](#despliegue-en-producción-pm2--nginx)
- [Estructura del proyecto](#estructura-del-proyecto)

---

## Arquitectura

El proyecto sigue una arquitectura **por capas y por feature**, sin sobre-ingeniería. Cada módulo (`auth`, `storage`) tiene sus propias capas, y lo transversal vive en `core/`, `infra/` y `middlewares/`.

```
Request
  │
  ▼
┌─────────────────┐
│    routes       │  define rutas + middlewares
├─────────────────┤
│  controller     │  valida payload, arma la respuesta HTTP
├─────────────────┤
│   service       │  lógica de negocio (auth, upload, BCrypt, S3)
├─────────────────┤
│  repository     │  acceso a MySQL (SQL parametrizado)
└─────────────────┘
        │                    │
        ▼                    ▼
     MySQL              Garage (S3)
```

**Principios:**

- El **controller** no toca la DB ni S3: solo valida y responde.
- El **service** contiene la lógica de negocio, sin conocer Express.
- El **repository** aísla el SQL: el único lugar donde se escriben queries.
- Los errores se lanzan como `HttpError` y los resuelve un único `errorHandler`.
- La configuración se valida al arrancar (`config/env.ts`): si falta algo, la app **no arranca** (fail-fast).

### ¿SQL puro o un ORM/query builder?

Se usa **SQL puro con `mysql2/promise` y sentencias parametrizadas** (`?`), porque:

- Es un proyecto pequeño-mediano: un ORM sería sobre-ingeniería.
- Las sentencias preparadas **previenen SQL injection** sin capas extra.
- SQL explícito es más fácil de revisar, optimizar y auditar.
- El pool de conexiones de `mysql2` ya da manejo de concurrencia y transacciones.

Si el proyecto crece mucho, se puede introducir un query builder sin reescribir todo, ya que el SQL está aislado en los `*.repository.ts`.

---

## Cómo funciona

### Flujo de autenticación

1. El cliente hace `POST /api/v1/login` con `user` (nombre de usuario) y `password`.
2. El servidor busca al usuario **por `user_name`**, compara el password con `bcrypt`.
3. Si es válido, firma un **JWT** que solo contiene `uuid` y `container`, con expiración corta (por defecto **5 minutos**).
4. El cliente envía el token en `Authorization: Bearer <token>`.
5. En cada request protegido, el middleware:
   - Verifica la firma del token,
   - **Busca al usuario por su `uuid`**,
   - Valida que el `container` coincida,
   - Adjunta el usuario (con su `id`) al request.

> Las **relaciones en la base de datos usan el `id`**, pero el token solo viaja con `uuid` y `container` (datos no sensibles). El `id` se resuelve en el servidor.

### Flujo de almacenamiento

1. El cliente autenticado hace `POST /api/v1/storage` con `name` e `imgbase64` (Data URI).
2. El servidor:
   - Valida el payload con Zod (ambos campos obligatorios),
   - Decodifica el Base64, detecta el MIME y valida el tamaño (`MAX_UPLOAD_MB`),
   - Genera una **key única** (`<uuid>.<ext>`) y sube el objeto a Garage vía **S3 API**,
   - Guarda en MySQL la URL, el nombre y el `user_id` de quien subió la imagen.
3. Devuelve la URL pública de la imagen.

### Dos caras de Garage

Garage expone **dos servicios HTTP distintos**, y esta API los usa de forma distinta:

| Servicio | Puerto típico | Uso en esta API |
|---|---|---|
| **S3 API** (`[s3_api]`) | `3900` | **Subida** de objetos autenticada (con credenciales) |
| **S3 Web** (`[s3_web]`) | `3902` | **Lectura pública** de objetos (navegador / `<img src>`) |
| RPC | `3901` | Comunicación interna del clúster (no se usa aquí) |
| Web/Admin | según config | Panel de administración (no se usa aquí) |

- La **subida** va directo al S3 API con las credenciales de la key.
- La **lectura** de la URL pública se sirve a través del **S3 Web** (bucket con `website access` habilitado), normalmente detrás de un reverse proxy (Nginx).

---

## Requisitos

- **Node.js ≥ 20**
- **MySQL ≥ 8**
- **Garage** (ver [instalación](#instalación-de-garage))
- **PM2** (producción)
- **Nginx** (producción, opcional pero recomendado)

---

## Instalación de Garage

[Garage](https://garagehq.deuxfleurs.fr/) es un almacenamiento de objetos S3-compatible, distribuido, ligero y self-hosted, escrito en Rust. Puedes instalarlo con Docker (recomendado) o como binario.

### Opción A — Docker (recomendado)

1. Crea un directorio y un archivo `garage.toml`:

   ```toml
   metadata_dir = "/var/lib/garage/meta"
   data_dir     = "/var/lib/garage/data"
   db_engine    = "lmdb"

   replication_mode = "single"          # 1 nodo; en clúster usa "3" (zona 3)
   rpc_bind_addr    = "[::]:3901"
   rpc_public_addr  = "127.0.0.1:3901"
   rpc_secret       = "REEMPLAZA_CON_UN_SECRETO_LARGO_ALEATORIO"

   [s3_api]
   s3_region     = "garage"
   api_bind_addr = "[::]:3900"
   root_domain   = "s3.example.com"     # dominio del API S3

   [s3_web]
   bind_addr   = "[::]:3902"
   root_domain = ".example.com"         # buckets como <bucket>.example.com
   index       = "index.html"

   [admin]
   api_bind_addr = "[::]:3903"
   admin_token   = "REEMPLAZA_CON_OTRO_SECRETO"
   metrics_token = "REEMPLAZA_CON_OTRO_SECRETO"
   ```

   Genera los secretos con:

   ```bash
   openssl rand -hex 32
   ```

2. Ejecuta el contenedor:

   ```bash
   docker run -d --name garage \
     --restart unless-stopped \
     -v $(pwd)/garage.toml:/etc/garage.toml:ro \
     -v $(pwd)/data:/var/lib/garage \
     -p 3900:3900 -p 3901:3901 -p 3902:3902 -p 3903:3903 \
     dxflrs/garage:v1.0.1
   ```

   > Ajusta la versión de la imagen según la última estable.

3. Verifica el estado del clúster:

   ```bash
   docker exec -it garage /garage status
   ```

   En un nodo único deberías ver el nodo con un ID. Si falta asignarle rol:

   ```bash
   docker exec -it garage /garage layout assign -z dc1 -c 1G <NODE_ID>
   docker exec -it garage /garage layout apply --version 1
   ```

### Opción B — Binario

```bash
# Descarga el binario desde https://garagehq.deuxfleurs.fr/download/
# (elige la versión y arquitectura de tu servidor)
wget <URL_DEL_BINARIO>
chmod +x garage
sudo mv garage /usr/local/bin/

# Usa el mismo garage.toml de arriba (ruta por defecto /etc/garage.toml)
garage server
```

Como servicio systemd (`/etc/systemd/system/garage.service`):

```ini
[Unit]
Description=Garage S3 storage
After=network.target

[Service]
ExecStart=/usr/local/bin/garage server
Restart=always
User=garage

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now garage
sudo systemctl status garage
```

### Crear bucket y credenciales

Una vez Garage está corriendo:

```bash
# 1. Crear un bucket
docker exec -it garage /garage bucket create images

# 2. Crear una key (credenciales S3)
docker exec -it garage /garage key create app-node
# Anota el Key ID y la Secret key que imprime

# 3. Dar permisos de lectura/escritura al bucket
docker exec -it garage /garage bucket allow --read --write images --key app-node

# 4. Habilitar el acceso web (lectura pública vía s3_web)
docker exec -it garage /garage bucket website --allow images

# 5. Verificar
docker exec -it garage /garage bucket list
docker exec -it garage /garage bucket info images
docker exec -it garage /garage key info app-node
```

> **Nota sobre permisos públicos:** el acceso anónimo al **S3 API** (`--key "*"`) no está soportado en todas las versiones de Garage. Para servir imágenes públicamente, usa el **S3 Web** con `bucket website --allow` (lo que hace que el bucket sea accesible por URL a través del `[s3_web]`).

### Prueba de escritura

```bash
AWS_ACCESS_KEY_ID=<KEY_ID> \
AWS_SECRET_ACCESS_KEY=<SECRET> \
aws --endpoint-url http://127.0.0.1:3900 s3 cp test.jpg s3://images/prueba.jpg

# Listar
AWS_ACCESS_KEY_ID=<KEY_ID> \
AWS_SECRET_ACCESS_KEY=<SECRET> \
aws --endpoint-url http://127.0.0.1:3900 s3 ls s3://images/
```

---

## Configuración de la base de datos

Crea la base y las tablas con `init.sql`:

```bash
mysql -h <DB_HOST> -u <DB_USER> -p < init.sql
```

O dentro de MySQL:

```sql
SOURCE /ruta/al/init.sql;
```

El esquema crea la base `garage_storage` con las tablas `user` y `storage` (relación por `user_id`, `uuid` único, `website` de buckets en Garage).

### Crear un usuario

El password **no se guarda en texto plano**, sino como hash `bcrypt`. Genéralo:

```bash
node -e "console.log(require('bcryptjs').hashSync('TuPasswordSeguro', 10))"
```

Inserta el usuario (el `container` es el **nombre del bucket** en Garage):

```sql
INSERT INTO `user` (uuid, user_name, container, hash)
VALUES (
  UUID(),                 -- o un uuid fijo
  'mi-usuario',
  'images',               -- bucket de Garage
  '$2a$10$...'            -- hash generado arriba
);
```

---

## Variables de entorno

Crea un `.env` en la raíz (nunca lo subas al repo):

```bash
# --- Server ---
PORT=3000

# --- MySQL ---
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=garage_storage
DB_POOL_LIMIT=10

# --- JWT (mínimo 32 caracteres) ---
JWT_SECRET=cambia_esto_por_un_secreto_largo_y_aleatorio_123456
JWT_EXPIRES_IN=5m

# --- Garage / S3 ---
GARAGE_ENDPOINT=http://127.0.0.1:3900   # s3_api (NO el s3_web)
GARAGE_REGION=garage
GARAGE_ACCESS_KEY=<KEY_ID de la key>
GARAGE_SECRET_KEY=<SECRET de la key>
GARAGE_BUCKET=images
PUBLIC_BASE_URL=https://media.example.com/images   # base de la URL pública
MAX_UPLOAD_MB=10
```

| Variable | Descripción |
|---|---|
| `PORT` | Puerto donde escucha la API. Debe coincidir con el `proxy_pass` de Nginx. |
| `DB_*` | Conexión MySQL. |
| `JWT_SECRET` | Secreto para firmar JWT (**≥ 32 chars**). |
| `JWT_EXPIRES_IN` | Expiración del token (por defecto `5m`). |
| `GARAGE_ENDPOINT` | **S3 API** de Garage (puerto de `[s3_api]`, típicamente `3900`). |
| `GARAGE_BUCKET` | Bucket donde se guardan las imágenes. |
| `PUBLIC_BASE_URL` | Prefijo de la URL pública servida por el **S3 Web** a través del proxy. |
| `MAX_UPLOAD_MB` | Tamaño máximo de imagen aceptada. |

Genera secretos seguros:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Uso en desarrollo

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar .env (ver sección anterior)

# 3. Crear la base de datos
mysql -h <DB_HOST> -u <DB_USER> -p < init.sql

# 4. Modo desarrollo (recarga en caliente)
npm run dev

# 5. Compilar para producción
npm run build

# 6. Ejecutar build
npm start
```

Health check:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

---

## Endpoints

Base: `/api/v1`

### `POST /login` — público

```http
POST /api/v1/login
Content-Type: application/json

{
  "user": "mi-usuario",
  "password": "TuPasswordSeguro"
}
```

**200 OK**

```json
{
  "code": "S-200",
  "message": "Se ha iniciado correcatmente",
  "data": {
    "access_token": "eyJhbGciOi..."
  }
}
```

### `POST /storage` — requiere token

```http
POST /api/v1/storage
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "mi-foto",
  "imgbase64": "data:image/png;base64,iVBORw0KG..."
}
```

**200 OK**

```json
{
  "code": "S-200",
  "message": "Se ha almacenado correctamente",
  "data": {
    "url": "https://media.example.com/images/3f2a1c9e-....png"
  }
}
```

**400 Bad Request** (campos faltantes/invalidos)

```json
{
  "code": "E-400",
  "message": "Los campos son incorrectos",
  "data": [
    { "field": "name", "message": "El campo name es obligatorio" }
  ]
}
```

**Ejemplo con curl (login + upload):**

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"user":"mi-usuario","password":"TuPasswordSeguro"}' | jq -r '.data.access_token')

curl -X POST http://localhost:3000/api/v1/storage \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"foto","imgbase64":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="}'
```

---

## Códigos de respuesta

| Código | HTTP | Cuándo |
|---|---|---|
| `S-200` | 200 | Login / subida correctos |
| `E-400` | 400 | Campos faltantes o Base64 inválido |
| `E-401` | 401 | Token ausente/expirado o credenciales inválidas |
| `E-403` | 403 | Sin permisos |
| `E-404` | 404 | Ruta no encontrada |
| `E-413` | 413 | Imagen excede `MAX_UPLOAD_MB` |
| `E-422` | 422 | Validación detallada (opcional) |
| `E-500` | 500 | Error inesperado |
| `E-503` | 503 | Servicio no disponible (DB/caída) |

---

## Despliegue en producción (PM2 + Nginx)

### 1. Compilar y arrancar con PM2

`ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [
    {
      name: 'gallery-api',
      script: 'dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: { NODE_ENV: 'production' },
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      merge_logs: true,
      time: true,
      kill_timeout: 5000,
    },
  ],
};
```

```bash
npm ci
npm run build
mkdir -p logs
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup    # ejecuta el comando que imprime para arranque automático
```

### 2. Nginx (reverse proxy)

```nginx
server {
    listen 443 ssl;
    server_name api.example.com;

    client_max_body_size 15m;

    # API (login + upload) → Node
    location /api/ {
        proxy_pass http://127.0.0.1:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Lectura pública de imágenes → Garage s3_web
server {
    listen 443 ssl;
    server_name media.example.com;

    location / {
        proxy_pass http://127.0.0.1:3902/;
        # Garage resuelve el bucket por Host: <bucket>.<root_domain>
        proxy_set_header Host <bucket>.media.example.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering on;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

> **Clave:** el host del bloque de imágenes debe corresponder al bucket de Garage. Con `[s3_web] root_domain = ".example.com"` el bucket `images` se sirve en `images.example.com`. Ajusta el `proxy_set_header Host` y `PUBLIC_BASE_URL` en consecuencia.

### 3. Flujo definitivo

```
Subir:   Cliente → Nginx (api.example.com) → Node :3000 → s3_api :3900 → bucket
Leer:    Navegador → Nginx (media.example.com) → s3_web :3902 → objeto público
```

### Notas de operación

- `NODE_ENV=production` en `ecosystem.config.cjs`.
- `.env` con `chmod 600` y fuera de git.
- Con PM2 en `cluster`, cada instancia abre su propio pool de MySQL: `DB_POOL_LIMIT × instancias ≤ max_connections`.
- `npm run build` **antes** de `pm2 reload` en cada despliegue.
- Considera `pm2 install pm2-logrotate` para rotar logs.

---

## Estructura del proyecto

```
src/
├── config/
│   └── env.ts                    # carga y valida variables de entorno (fail-fast)
├── core/
│   ├── http.ts                   # códigos HTTP, códigos y mensajes de la API
│   ├── HttpError.ts              # errores tipados (400, 401, 500...)
│   ├── response.ts               # helpers de respuesta { code, message, data }
│   ├── validate.ts               # validación con Zod
│   └── asyncHandler.ts           # wrapper async para los handlers
├── infra/
│   ├── mysql.ts                  # pool de MySQL + query parametrizada
│   └── s3.ts                     # cliente S3 para Garage + upload
├── middlewares/
│   ├── auth.middleware.ts        # valida JWT y adjunta el usuario
│   └── error.middleware.ts       # 404 y manejador central de errores
├── modules/
│   ├── auth/
│   │   ├── auth.routes.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.schema.ts        # validación del login
│   │   └── auth.types.ts
│   └── storage/
│       ├── storage.routes.ts
│       ├── storage.controller.ts
│       ├── storage.service.ts
│       ├── storage.repository.ts
│       ├── storage.schema.ts     # validación de la subida
│       └── storage.types.ts
├── routes/
│   └── v1.ts                     # router de /api/v1
├── app.ts                        # configuración de Express
└── server.ts                     # arranque + graceful shutdown
```

### ¿Dónde agrego código nuevo?

| Necesito... | Voy a... |
|---|---|
| Un endpoint nuevo | `modules/<feature>/` con las 6 capas (routes/controller/service/repository/schema/types) |
| Una query nueva | `modules/<feature>/<feature>.repository.ts` (SQL parametrizado) |
| Un error nuevo | `core/HttpError.ts` + `core/http.ts` |
| Una integración externa (otra API/cache) | `infra/` |
| Un middleware nuevo | `middlewares/` |
| Un cambio global de respuesta | `core/response.ts` |

---

## Licencia

MIT
