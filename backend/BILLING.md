# Billing (Laravel Cashier + Stripe)

Integración SaaS: planes, usuarios extra por negocio y addons.

## Configuración

1. **Instalar dependencias**
   ```bash
   composer update
   ```

2. **Variables de entorno** (en `.env`):
   - `STRIPE_KEY` – Clave pública de Stripe (pk_…)
   - `STRIPE_SECRET` – Clave secreta (sk_…)
   - `STRIPE_WEBHOOK_SECRET` – Secreto del webhook (whsec_…)
   - `CASHIER_CURRENCY` – Moneda (ej: `eur`, `usd`)

3. **Migraciones**
   ```bash
   php artisan migrate
   ```
   Se añaden columnas de Cashier a `businesses` y tablas `subscriptions` y `subscription_items`.

4. **Stripe Dashboard**
   - Crear productos y precios para cada plan, addon y “usuario extra”.
   - Opcional: definir los IDs en `.env`:
     - `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_PRO`
     - `STRIPE_PRICE_EXTRA_USER`
     - `STRIPE_PRICE_ADDON_MARKETING`, `STRIPE_PRICE_ADDON_INTEGRATIONS`
   - O editar `config/subscription.php` con los `stripe_price_id` correctos.

5. **Webhook en Stripe**
   - URL: `https://tu-dominio.com/api/stripe/webhook`
   - Eventos recomendados: `customer.subscription.*`, `invoice.*`, etc. (ver [docs Cashier](https://laravel.com/docs/billing#handling-stripe-webhooks)).

## API

Todas bajo `auth` (usuario con `business_id`).

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/billing/plans` | Lista planes y addons (config) |
| GET | `/api/billing/status` | Estado de suscripción del negocio |
| POST | `/api/billing/checkout` | Crear sesión Checkout (body: `plan`, `success_url`, `cancel_url`, opcional `addons[]`) |
| POST | `/api/billing/portal` | URL del portal de facturación (body: `return_url`) |
| POST | `/api/billing/addons/{addonSlug}` | Añadir addon a la suscripción |
| DELETE | `/api/billing/addons/{addonSlug}` | Quitar addon |
| PUT | `/api/billing/extra-users` | Establecer cantidad de usuarios extra (body: `quantity`) |

## Proteger rutas por suscripción

En `routes/api.php` puedes usar el middleware `subscribed` para exigir suscripción activa (o trial):

```php
Route::middleware(['auth', 'subscribed'])->group(function () {
    // rutas que requieren plan de pago
});
```

## Modelo

- **Billable**: `App\Models\Business` (trait `Laravel\Cashier\Billable`).
- Stripe Customer se crea por negocio; el email usado es `owner_email` (método `stripeEmail()` en `Business`).
