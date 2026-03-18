# Convención de metadatos en Stripe para planes y addons

Este proyecto ya no usa `config/subscription.php` para definir planes y precios.  
En su lugar, **todos los planes y addons se descubren directamente desde Stripe** usando la API.

Esta guía explica cómo configurar productos/precios en Stripe para que el backend los entienda.

---

## 1. Conceptos básicos en Stripe

- **Product (`prod_...`)**: representa un plan o addon a nivel de catálogo.
- **Price (`price_...`)**: representa un precio concreto de ese producto (monto, moneda, intervalo).
- En este sistema:
  - Un **plan** = 1 producto con `metadata.kind = "plan"` + al menos un `Price` recurrente activo.
  - Un **addon** = 1 producto con `metadata.kind = "addon"` + al menos un `Price` recurrente activo.

El backend llama a Stripe y construye su propio modelo a partir de estos datos y de la metadata de cada producto.

---

## 2. Metadatos requeridos para PLANES

Para cada **plan** que quieras ofrecer:

1. Crea un **Product** en Stripe (modo test o live según entorno).
2. En la sección **Metadata** del producto añade:

- `kind` → **obligatorio**
  - Valor: `plan`
  - El backend solo considerará como planes los productos con `kind = "plan"`.

- `slug` → **recomendado**
  - Identificador interno que usará el frontend/Backend al contratar el plan.
  - Ejemplos: `starter`, `growth`, `pro`.
  - Si no lo pones, el sistema usará el `product.id` como slug (ej. `prod_ABC123`).

- `included_users` → opcional
  - Número entero de usuarios incluidos en el plan.
  - Ejemplos: `1`, `3`, `10`.

- `features` → opcional
  - Texto multilinea con una viñeta por línea.
  - Ejemplo:
    ```
    Agenda y citas
    1 profesional
    Recordatorios por email
    ```

3. Crea al menos un **Price** para ese producto:

- Tipo: `recurring`.
- Estado: `active`.
- Moneda y monto: los que quieras usar en el plan (ej. `mxn`, `usd`).
- Intervalo: mensual, anual, etc.

El backend construye para cada plan una estructura similar a:

```php
$plans[$slug] = [
  'name' => $product->name,
  'slug' => $slug,
  'included_users' => (int) $product->metadata['included_users'] ?? 0,
  'features' => [...], // array de strings (cada línea de metadata.features)
  'stripe' => [
    'id' => $price->id,          // price_...
    'currency' => $price->currency,
    'unit_amount' => $price->unit_amount,
    'nickname' => $price->nickname,
    'interval' => $price->recurring->interval,
    'interval_count' => $price->recurring->interval_count,
    'product' => $product->id,   // prod_...
  ],
];
```

> Importante: el slug que ve el frontend (y que se envía a `/api/billing/checkout`) es `metadata.slug`  
> o, si falta, el `product.id`.

---

## 3. Metadatos requeridos para ADDONS

Para cada **addon**:

1. Crea un **Product** en Stripe.
2. En Metadata añade:

- `kind` → **obligatorio**
  - Valor: `addon`
  - El backend solo considerará como addons los productos con `kind = "addon"`.

- `slug` → **recomendado**
  - Identificador interno, por ejemplo: `marketing`, `integrations`.

3. Crea al menos un **Price** recurrente activo para ese producto.

El backend generará algo como:

```php
$addons[$slug] = [
  'name' => $product->name,
  'slug' => $slug,
  'type' => 'recurring',
  'stripe' => [
    'id' => $price->id,
    'currency' => $price->currency,
    'unit_amount' => $price->unit_amount,
    'nickname' => $price->nickname,
    'interval' => $price->recurring->interval,
    'interval_count' => $price->recurring->interval_count,
    'product' => $product->id,
  ],
];
```

---

## 4. Usuarios extra (extra seats)

El precio de **usuarios extra** no se descubre por metadata, por simplicidad.  
Se configura con una variable de entorno:

```env
STRIPE_EXTRA_USER_PRICE_ID=price_xxxxxxxxxxxxx
```

Debes crear en Stripe:

- Un producto para “Usuario extra” (opcional).
- Un `Price` recurrente activo para ese producto.
- Pegar el `price_...` en `STRIPE_EXTRA_USER_PRICE_ID`.

El backend usa ese `price_id` para:

- Añadir/quitar cantidad de usuarios extra en la suscripción existente.
- Calcular cuántos usuarios adicionales tiene contratados el negocio.

---

## 5. Resumen rápido para crear un NUEVO plan

1. En Stripe (modo test o live) crea un **Product**:
   - Name: `Plan Starter` (ejemplo).
   - Metadata:
     - `kind = plan`
     - `slug = starter`
     - `included_users = 1`
     - `features =` (varias líneas con ventajas).
2. Crea un **Price** recurrente activo para ese producto:
   - Ej: `mxn 299 / mes`.
3. Opcional: repite para `growth`, `pro`, etc. siguiendo la misma convención.
4. No hace falta tocar código ni configs: el endpoint `/api/billing/plans` mostrará el nuevo plan automáticamente.

---

## 6. Resumen rápido para crear un NUEVO addon

1. En Stripe crea un **Product**:
   - Name: `Marketing Suite`.
   - Metadata:
     - `kind = addon`
     - `slug = marketing`
2. Crea un **Price** recurrente activo (ej. `mxn 99 / mes`).
3. El endpoint `/api/billing/plans` incluirá este addon en la lista de addons.

---

## 7. Notas importantes

- Los datos críticos (precio, moneda, intervalo) se leen SIEMPRE de Stripe.
- La metadata en el producto define solo:
  - Tipo (`kind`), slug interno, número de usuarios incluidos y features descriptivas.
- Si cambias un precio en Stripe (mismo `price_...`), el frontend verá el nuevo monto sin cambios de código.
- Si quieres “retirar” un plan o addon:
  - Marca el `Price` como inactivo en Stripe, o
  - Quita `kind`/ajusta metadata para que no cumpla la convención (por ejemplo, `kind = legacy`).

