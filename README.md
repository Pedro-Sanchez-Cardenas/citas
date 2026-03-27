# Appointments — SaaS multi-tenant para salones

Monorepo con **tres piezas** alineadas al producto:

| Pieza | Carpeta | Descripción |
|-------|---------|-------------|
| **Portal del negocio** | [`frontend/`](frontend/) | Panel interno: agenda, profesionales, servicios, clientes, inventario, pagos, reportes, automatizaciones |
| **Portal del cliente** | [`customer-portal/`](customer-portal/) | Reserva y cuenta del cliente final por slug del negocio |
| **Core (API)** | [`backend/`](backend/) | Laravel: multi-tenant, permisos, API REST, reserva pública, billing Stripe (plataforma) |

Documentación detallada del mapa funcional → código: **[`docs/ARQUITECTURA_SAAS.md`](docs/ARQUITECTURA_SAAS.md)**.

## Requisitos locales

- Docker (recomendado): ver [`compose.yml`](compose.yml)
- O PHP/Composer + Node según cada app (`backend/README.md`, READMEs en `frontend/` y `customer-portal/`)

## Arranque rápido (orientativo)

1. Levantar servicios con Docker Compose si aplica.
2. Backend: variables en `backend/.env` (ver `backend/.env.example`).
3. Frontends: `NEXT_PUBLIC_API_BASE_URL` apuntando al API.

## Módulos del panel (legado)

La checklist por módulos del API vive aún en comentarios o issues; la fuente de verdad de **estructura de producto** es `docs/ARQUITECTURA_SAAS.md`.
