## Backend – Citas (Laravel 12)

Backend para un SaaS multi‑negocio y multi‑sucursal orientado a negocios de belleza (barberías, salones, spas, uñas, pestañas, etc.).  
Está construido sobre Laravel 12 y expone una API REST pensada para un frontend web/mobile.

### Arquitectura general

- **Multi‑negocio (SaaS)**:
  - **`Business`**: representa una empresa (barbería, cadena de salones, etc.).
  - Cada `User` pertenece a un `Business` (`users.business_id`).
  - Casi todas las entidades principales tienen `business_id` y se filtran por el negocio del usuario autenticado.
- **Multi‑sucursal**:
  - **`Branch`**: sucursal física del negocio, ligada a un `Business`.
  - Muchos recursos se pueden filtrar por `branch_id` (agenda, servicios, profesionales, inventario, reportes).
- **Autenticación**:
  - Login de sesión clásica con Laravel (`/api/login`, `/api/logout`, `/api/me`).
  - Middleware `auth` en todos los endpoints internos; las rutas públicas se agrupan bajo `/api/public/{business}`.
- **Patrón interno**:
  - **Models (Eloquent)** → **Repositories** → **Services** → **Controllers (API)**.
  - Repositorios registrados vía `AppServiceProvider`.

---

## Módulo Core: Negocios, Sucursales y Usuarios

- **Modelos clave**:
  - `Business`: configuración SaaS del negocio (`settings` permite flags como `auto_confirm_appointments`, `max_overbooking_per_slot`, etc.).
  - `Branch`: sucursal (`business_id`, zona horaria, dirección).
  - `User`: pertenece a un `Business` y se usa para autenticación y scoping.
- **Uso**:
  - El frontend debe asumir que **todas** las llamadas autenticadas se realizan en el contexto del `business_id` del usuario.
  - Los filtros por sucursal (`branch_id`) se pasan como query param donde aplica.

---

## Módulo de Agenda Inteligente

### Modelos

- **`Appointment`**: cita.
  - Campos: `business_id`, `branch_id`, `professional_id`, `service_id`, `combined_service_id`, `client_id`, datos de cliente, `start_at`, `end_at`, `status`, `source`, `deposit_amount_cents`, `deposit_status`, `overbooking_allowed`, `buffer_before_minutes`, `buffer_after_minutes`, `notes`.
- **`WorkingHour`**: horario laboral dinámico.
  - Campos: `business_id`, `branch_id` (opcional), `professional_id` (opcional), `weekday` (0–6), `start_time`, `end_time`, `effective_from`, `effective_until`, `is_active`.
- **`TimeBlock`**: bloqueos manuales de agenda (vacaciones, mantenimiento, etc.).
- **`Service`**: servicio simple (ver módulo de servicios).
- **`CombinedService` + `CombinedServiceItem`**: servicios combinados (combo corte + barba, etc.).

### Servicios de dominio

- **`CalendarService`**:
  - `getDayView(date, branchId?, professionalId?)` → citas, horarios laborales y bloqueos de un día.
  - `getWeekView(startOfWeek, branchId?, professionalId?)` → lo mismo para una semana.
- **`AppointmentService`**:
  - Crea, actualiza y mueve citas (drag & drop) respetando:
    - Horarios laborales (`WorkingHour`) dinámicos.
    - Bloqueos (`TimeBlock`).
    - Buffers antes/después de la cita (`buffer_before_minutes`, `buffer_after_minutes`).
    - Overbooking controlado (`overbooking_allowed` + `Business.settings.max_overbooking_per_slot`).
    - Confirmación automática según `Business.settings.auto_confirm_appointments`.
  - Cuando una cita pasa a `attended` consume inventario automáticamente (ver módulo Inventario).

### Endpoints principales

- **Vistas de calendario** (`auth`):
  - `GET /api/agenda/day?date=YYYY-MM-DD&branch_id=&professional_id=`
  - `GET /api/agenda/week?start=YYYY-MM-DD&branch_id=&professional_id=`
- **Citas** (`auth`):
  - `POST /api/agenda/appointments`
  - `PATCH /api/agenda/appointments/{appointment}`
  - `PATCH /api/agenda/appointments/{appointment}/move` (drag & drop).
- **Bloqueos** (`auth`):
  - `POST /api/agenda/blocks`
  - `DELETE /api/agenda/blocks/{block}`
- **Horarios laborales** (`auth`):
  - `GET /api/working-hours?branch_id=&professional_id=`
  - `POST /api/working-hours`
  - `GET /api/working-hours/{id}`
  - `PUT/PATCH /api/working-hours/{id}`
  - `DELETE /api/working-hours/{id}`
- **Servicios combinados** (`auth`):
  - `GET /api/combined-services?branch_id=`
  - `POST /api/combined-services` (incluye items).
  - `GET /api/combined-services/{id}`
  - `PUT/PATCH /api/combined-services/{id}` (puede reescribir items).
  - `DELETE /api/combined-services/{id}`

---

## Módulo de Servicios

### Modelos

- `ServiceCategory`: categorías de servicios por negocio/sucursal.
- `Service`: servicio simple con duración base y precio.
- Relaciones:
  - `Service` ↔ `Professional` (pivot `professional_service`).
  - `Service` ↔ `Product` (pivot `service_product`, cantidad consumida).

### API

- **Categorías** (`auth`):
  - `GET /api/service-categories`
  - `POST /api/service-categories`
  - `GET /api/service-categories/{id}`
  - `PUT/PATCH /api/service-categories/{id}`
  - `DELETE /api/service-categories/{id}`
- **Servicios** (`auth`):
  - `GET /api/services?branch_id=`
  - `POST /api/services`
  - `GET /api/services/{service}`
  - `PUT/PATCH /api/services/{service}`
  - `DELETE /api/services/{service}`
- **Profesionales por servicio** (`auth`):
  - `GET /api/services/{service}/professionals`
  - `PUT /api/services/{service}/professionals`  
    Body: `{"professional_ids": [1,2,3]}`
- **Materiales por servicio** (`auth`):
  - `GET /api/services/{service}/materials`
  - `PUT /api/services/{service}/materials`  
    Body: `{"materials":[{"product_id":1,"quantity":10.5}, ...]}`

---

## Módulo de Profesionales

- **Modelo**: `Professional` (sucursal, contacto, color, `commission_rate`, `base_salary_cents`, `is_active`).
- **API** (`auth`):
  - `GET /api/professionals?branch_id=`
  - `POST /api/professionals`
  - `GET /api/professionals/{id}`
  - `PUT/PATCH /api/professionals/{id}`
  - `DELETE /api/professionals/{id}`
- Integrado con:
  - Agenda (citas, horarios, bloqueos).
  - Reportes (rendimiento, ocupación, ingresos por profesional).

---

## Módulo de Clientes (CRM de Belleza)

### Modelos

- `Client`: datos del cliente (contacto, cumpleaños, alergias, notas, preferencias, última visita).
- `ClientMedia`: media ligada a cliente y opcionalmente a una cita (fotos antes/después).

### API clientes

- `GET /api/clients`
- `POST /api/clients`
- `GET /api/clients/{client}`
- `PUT/PATCH /api/clients/{client}`
- `DELETE /api/clients/{client}`
- **Historial completo**:
  - `GET /api/clients/{client}/history`  
    Devuelve:
    - `client`: datos del cliente.
    - `appointments`: todas las citas (con sucursal, profesional, servicio, combinado, pagos).
    - `media`: fotos asociadas.

### API media (fotos antes/después)

- `GET /api/clients/{client}/media`
- `POST /api/clients/{client}/media`  
  Body: `{"appointment_id":1,"type":"before|after|other","url":"...","notes":"..."}`  
- `DELETE /api/client-media/{media}`

---

## Módulo de Reservas Online (público)

Rutas abiertas bajo `/api/public/{business}` (donde `{business}` es el `slug` del negocio).

- `GET /api/public/{business}/services`  
  - Devuelve sucursales y servicios activos para ese negocio.
- `GET /api/public/{business}/availability?date=YYYY-MM-DD&branch_id=&professional_id=`  
  - Usa internamente `CalendarService` para exponer la disponibilidad diaria.
- `POST /api/public/{business}/book`  
  - Crea una cita (`Appointment`) con origen `online`, reutilizando toda la lógica de validación de Agenda Inteligente.

La integración con pagos online (Stripe / MercadoPago) puede apoyarse en este endpoint más los endpoints de `payments` / webhooks.

---

## Módulo de Pagos y POS

- **Modelo**: `Payment` (`business_id`, `branch_id`, `appointment_id`, `client_id`, `method`, `amount_cents`, `tip_cents`, `status`, `provider`, etc.).
- **API** (`auth`):
  - `GET /api/payments?branch_id=`
  - `POST /api/payments`
  - `GET /api/payments/{payment}`
- Si se pasa `appointment_id`, `PaymentService` registra el pago asociado a la cita (usado luego en reportes).

---

## Módulo de Inventario

### Modelos

- `Product`: producto (tintes, químicos, productos capilares, etc.) con `cost_cents`, `price_cents`, `unit`, `is_reusable`.
- `ProductStock`: stock por sucursal (`branch_id`, `product_id`, `quantity`, `min_quantity`).
- `ProductMovement`: movimientos de inventario (`in` / `out`), puede referenciar a una `appointment_id`.

### API

- **Productos** (`auth`):
  - `GET /api/products`
  - `POST /api/products`
  - `GET /api/products/{product}`
  - `PUT/PATCH /api/products/{product}`
  - `DELETE /api/products/{product}`
- **Stocks** (`auth`):
  - `GET /api/inventory/stocks?branch_id=`
- **Ajustes manuales** (`auth`):
  - `POST /api/inventory/adjust`  
    Body: `{"branch_id":1,"product_id":1,"type":"in|out","quantity":10,"reason":"ajuste"}`

### Consumo automático por servicio

Cuando una cita cambia a estado `attended`:

- `AppointmentService`:
  - Suma los materiales requeridos de:
    - `service.products` (pivot con `quantity`).
    - `combinedService.items.service.products` si es una cita de servicio combinado.
  - Genera `ProductMovement` de tipo `out` por cada producto (`reason = appointment_consumption`, `appointment_id` de la cita).
  - Actualiza `ProductStock` por sucursal.

La lógica evita consumir dos veces para la misma cita comprobando movimientos previos con ese `appointment_id` y `reason`.

---

## Módulo de Marketing Automatizado

- **Modelos**:
  - `Automation`: definición de automatización (`trigger` = `appointment_reminder`, `inactive_client`, `birthday`, `promotion`, `conditions`, `action`, `is_active`).
  - `AutomationLog`: registro de envíos (cliente, canal, estado, error).
- **API** (`auth`):
  - `GET /api/automations`
  - `POST /api/automations`
  - `GET /api/automations/{automation}`
  - `PUT/PATCH /api/automations/{automation}`
  - `DELETE /api/automations/{automation}`

La ejecución real de automatizaciones (cron jobs, integración con email/WhatsApp/SMS) se haría vía comandos programados que lean estas definiciones.

---

## Módulo de Reportes y Analytics

Implementado en `ReportService` + `ReportController` con endpoints por negocio.

- **Resumen de negocio** (`auth`):
  - `GET /api/reports/business-summary?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - Devuelve:
    - Totales de citas (total, canceladas, no‑show, atendidas).
    - Ingresos totales y ticket promedio (a partir de `payments`).
    - Top servicios por cantidad de citas.
- **Rendimiento de profesionales** (`auth`):
  - `GET /api/reports/professionals?from=&to=&branch_id=`
  - Devuelve por profesional:
    - Citas totales, atendidas, canceladas.
    - Minutos reservados vs. minutos de trabajo estimados (a partir de `working_hours`).
    - Ocupación (%).
    - Ingresos generados.
- **Rendimiento de servicios** (`auth`):
  - `GET /api/reports/services?from=&to=&branch_id=`
  - Devuelve por servicio:
    - Número de citas.
    - Ingresos asociados.

---

## Flujo típico de uso desde el frontend

- **Onboarding negocio**:
  - Crear `Business` + `Branches` + usuarios (seed o UI de administración).
  - Configurar `settings` del negocio (buffers, overbooking, auto confirmación, etc.).
- **Configuración inicial**:
  - Crear categorías y servicios.
  - Asignar profesionales a servicios.
  - Definir materiales por servicio.
  - Configurar horarios laborales (`working-hours`) y bloqueos iniciales.
- **Operación diaria**:
  - Usar `/api/agenda/day|week` para renderizar el calendario.
  - Crear/mover/cancelar citas.
  - Registrar pagos.
  - Ejecutar reservas online vía `/api/public/{business}`.
- **Backoffice**:
  - Gestionar inventario y ajustes.
  - Revisar media e historial de clientes.
  - Consultar reportes para ver ocupación, servicios más vendidos y rendimiento del staff.

