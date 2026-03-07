<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Planes (paquetes) de suscripción
    |--------------------------------------------------------------------------
    | Cada plan tiene un price_id de Stripe (recurring). Crear los productos
    | y precios en Stripe Dashboard y pegar aquí los IDs (price_xxx).
    */
    'plans' => [
        'starter' => [
            'name' => 'Starter',
            'slug' => 'starter',
            'stripe_price_id' => env('STRIPE_PRICE_STARTER', 'price_starter'),
            'included_users' => 1,
            'features' => ['Agenda', 'Citas', '1 profesional'],
        ],
        'growth' => [
            'name' => 'Growth',
            'slug' => 'growth',
            'stripe_price_id' => env('STRIPE_PRICE_GROWTH', 'price_growth'),
            'included_users' => 3,
            'features' => ['Todo Starter', 'Múltiples profesionales', 'Reportes'],
        ],
        'pro' => [
            'name' => 'Pro',
            'slug' => 'pro',
            'stripe_price_id' => env('STRIPE_PRICE_PRO', 'price_pro'),
            'included_users' => 10,
            'features' => ['Todo Growth', 'Automatizaciones', 'Soporte prioritario'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Usuarios extra
    |--------------------------------------------------------------------------
    | Precio recurrente por usuario adicional por ciclo de facturación.
    | Debe ser un price_id de Stripe con tipo recurring.
    */
    'extra_user' => [
        'stripe_price_id' => env('STRIPE_PRICE_EXTRA_USER', 'price_extra_user'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Addons (complementos)
    |--------------------------------------------------------------------------
    | Productos opcionales: one_time (pago único) o recurring (mensual/anual).
    | stripe_price_id debe existir en Stripe.
    */
    'addons' => [
        'marketing' => [
            'name' => 'Marketing Suite',
            'slug' => 'marketing',
            'stripe_price_id' => env('STRIPE_PRICE_ADDON_MARKETING', 'price_addon_marketing'),
            'type' => 'recurring', // recurring | one_time
        ],
        'integrations' => [
            'name' => 'Integraciones',
            'slug' => 'integrations',
            'stripe_price_id' => env('STRIPE_PRICE_ADDON_INTEGRATIONS', 'price_addon_integrations'),
            'type' => 'recurring',
        ],
    ],

];
