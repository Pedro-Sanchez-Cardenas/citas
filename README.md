# Citas Pro Beauty

Aplicación de gestión de citas para negocios de belleza (salones, barberías, spas). Frontend en **Next.js** (React) con **Tailwind CSS** y backend API en **Laravel** con autenticación **Sanctum** (SPA, cookies).

## Stack

- **Frontend:** Next.js 14, React, Tailwind CSS 4, Axios
- **Backend:** Laravel 12, PHP 8.3, Sanctum, MySQL
- **Infra:** Docker Compose, nginx

## Requisitos

- Docker y Docker Compose
- (Opcional) Node 20+ y PHP 8.3+ para desarrollo local sin Docker

## Inicio rápido con Docker

1. Clona el repositorio y entra en la carpeta del proyecto.

2. **Backend:** copia el archivo de entorno y genera la clave de aplicación.
   ```bash
   cp backend/.env.example backend/.env
   cd backend && php artisan key:generate && cd ..
   ```
   Si usas Docker y no tienes PHP local, puedes generar la key después de levantar el backend o usar un valor fijo en `backend/.env` (`APP_KEY=base64:...`).

3. Levanta todos los servicios.
   ```bash
   docker compose up -d
   ```

4. Ejecuta las migraciones (primera vez).
   ```bash
   docker compose exec backend php artisan migrate
   ```

5. Abre en el navegador: **http://localhost:8080**

El frontend se sirve por nginx en el puerto **8080**. La API está en el mismo origen (`/api/`, `/sanctum/`).

## Variables de entorno

### Backend (`backend/.env`)

- `APP_KEY` – Obligatorio; generar con `php artisan key:generate`.
- `DB_*` – Conexión MySQL (en Docker: `DB_HOST=mysql`, etc.).
- `FRONTEND_URL` – Origen del frontend para CORS (ej: `http://localhost:8080`).
- `SANCTUM_STATEFUL_DOMAINS` – Mismo host que el frontend (ej: `localhost:8080`).
- `CACHE_STORE`, `SESSION_DRIVER` – En compose se usan `file` y `cookie` para desarrollo.

### Frontend

- `NEXT_PUBLIC_API_BASE_URL` – Dejar vacío cuando el frontend se accede por nginx (mismo origen). Para desarrollo directo contra otra URL, poner la base de la API.

Ejemplo en `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=
```

## Desarrollo local (sin Docker)

- **Backend:** `cd backend && composer install && php artisan serve` (y MySQL en marcha, `.env` con `DB_*` correctos).
- **Frontend:** `cd frontend && npm install && npm run dev`.
- Ajusta `NEXT_PUBLIC_API_BASE_URL` y `FRONTEND_URL` / `SANCTUM_STATEFUL_DOMAINS` si usas puertos distintos.

## Estructura del backend (patrón Request → Controller → Service → Repository)

- **Routes:** `routes/api.php` (API), `routes/web.php` (welcome, CSRF).
- **Controllers:** Reciben Form Requests, llaman a Services y devuelven JSON (p. ej. con API Resources).
- **Services:** Lógica de negocio (auth, dashboard); usan Repositories y Guard/Session.
- **Repositories:** Contratos en `app/Repositories/Contracts/` e implementaciones en `app/Repositories/`.
- **Form Requests:** Validación de entrada (ej: `LoginRequest`).
- **API Resources:** Formato de respuestas (ej: `UserResource`).

## Tests del backend

```bash
cd backend
composer install
cp .env.example .env && php artisan key:generate
php artisan test
```

Los tests de feature usan base de datos en memoria (SQLite) y `RefreshDatabase`.

## Licencia

Uso interno / proyecto privado.
