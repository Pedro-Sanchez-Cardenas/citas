<?php

namespace App\Services;

use App\Models\Business;
use Illuminate\Support\Arr;
use Stripe\Price as StripePrice;
use Stripe\Product as StripeProduct;
use Stripe\Stripe;

class SubscriptionService
{
    /**
     * Obtiene los planes desde Stripe.
     *
     * Convención:
     * - Precio recurrente activo en Stripe.
     * - El producto asociado debe tener metadata:
     *   - kind = "plan"
     *   - slug (opcional; si no, se usa el product id)
     *   - included_users (opcional, número entero)
     *   - features (opcional, texto con viñetas separadas por saltos de línea)
     */
    public function getPlans(): array
    {
        $this->ensureStripeConfigured();

        $prices = StripePrice::all([
            'active' => true,
            'type' => 'recurring',
            'limit' => 100,
            'expand' => ['data.product'],
        ]);

        $plans = [];

        foreach ($prices->data as $price) {
            /** @var \Stripe\Product|string|null $product */
            $product = $price->product;
            if (is_string($product)) {
                $product = StripeProduct::retrieve($product);
            }
            if (! $product instanceof StripeProduct) {
                continue;
            }

            $kind = $product->metadata['kind'] ?? 'plan';
            if ($kind !== 'plan') {
                continue;
            }

            $slug = $product->metadata['slug'] ?? $product->id;
            $includedUsers = isset($product->metadata['included_users'])
                ? (int) $product->metadata['included_users']
                : 0;

            $featuresRaw = $product->metadata['features'] ?? '';
            $features = array_values(array_filter(array_map('trim', preg_split("/\\r?\\n/", (string) $featuresRaw))));

            $plans[$slug] = [
                'name' => $product->name,
                'slug' => $slug,
                'included_users' => $includedUsers,
                'features' => $features,
                'stripe' => [
                    'id' => $price->id,
                    'currency' => $price->currency,
                    'unit_amount' => $price->unit_amount,
                    'nickname' => $price->nickname,
                    'interval' => $price->recurring->interval ?? null,
                    'interval_count' => $price->recurring->interval_count ?? null,
                    'product' => $product->id,
                ],
            ];
        }

        return $plans;
    }

    /**
     * Obtiene addons desde Stripe.
     *
     * Convención:
     * - Precio recurrente activo.
     * - Producto con metadata kind = "addon".
     */
    public function getAddons(): array
    {
        $this->ensureStripeConfigured();

        $prices = StripePrice::all([
            'active' => true,
            'type' => 'recurring',
            'limit' => 100,
            'expand' => ['data.product'],
        ]);

        $addons = [];

        foreach ($prices->data as $price) {
            /** @var \Stripe\Product|string|null $product */
            $product = $price->product;
            if (is_string($product)) {
                $product = StripeProduct::retrieve($product);
            }
            if (! $product instanceof StripeProduct) {
                continue;
            }

            $kind = $product->metadata['kind'] ?? null;
            if ($kind !== 'addon') {
                continue;
            }

            $slug = $product->metadata['slug'] ?? $product->id;

            $addons[$slug] = [
                'name' => $product->name,
                'slug' => $slug,
                'type' => 'recurring',
                'stripe' => [
                    'id' => $price->id,
                    'currency' => $price->currency,
                    'unit_amount' => $price->unit_amount,
                    'nickname' => $price->nickname,
                    'interval' => $price->recurring->interval ?? null,
                    'interval_count' => $price->recurring->interval_count ?? null,
                    'product' => $product->id,
                ],
            ];
        }

        return $addons;
    }

    /**
     * Precio usado para usuarios extra.
     *
     * Convención simple: se toma de env STRIPE_EXTRA_USER_PRICE_ID.
     */
    public function getExtraUserPriceId(): ?string
    {
        return env('STRIPE_EXTRA_USER_PRICE_ID');
    }

    protected function ensureStripeConfigured(): void
    {
        $secret = config('cashier.secret') ?? env('STRIPE_SECRET');
        if ($secret) {
            Stripe::setApiKey($secret);
        }
    }

    public function getPlanBySlug(string $slug): ?array
    {
        return Arr::get($this->getPlans(), $slug);
    }

    public function getAddonBySlug(string $slug): ?array
    {
        return Arr::get($this->getAddons(), $slug);
    }

    /**
     * Estado de suscripción del negocio para el frontend.
     *
     * @return array<string, mixed>
     */
    public function getStatus(Business $business): array
    {
        $subscription = $business->subscription('default');
        $includedUsers = 0;
        $planSlug = null;
        $planName = null;
        $extraUserQuantity = 0;
        $addonSlugs = [];

        if ($subscription && $subscription->items->isNotEmpty()) {
            $extraUserPriceId = $this->getExtraUserPriceId();
            $plansConfig = $this->getPlans();
            $addonsConfig = $this->getAddons();

            foreach ($subscription->items as $item) {
                $priceId = $item->stripe_price;
                if ($priceId === $extraUserPriceId) {
                    $extraUserQuantity = (int) $item->quantity;
                    continue;
                }
                foreach ($plansConfig as $slug => $plan) {
                    if (Arr::get($plan, 'stripe.id') === $priceId) {
                        $planSlug = $slug;
                        $planName = $plan['name'] ?? $slug;
                        $includedUsers = (int) ($plan['included_users'] ?? 0);
                        continue 2;
                    }
                }
                foreach ($addonsConfig as $slug => $addon) {
                    if (Arr::get($addon, 'stripe.id') === $priceId) {
                        $addonSlugs[] = $slug;
                        break;
                    }
                }
            }
        }

        $currentUsers = $business->users()->count();
        $maxUsers = $includedUsers + $extraUserQuantity;
        $canAddMoreUsers = $maxUsers === 0 || $currentUsers < $maxUsers;

        return [
            'subscribed' => $subscription && $subscription->valid(),
            'on_trial' => $business->onGenericTrial(),
            'trial_ends_at' => $business->trial_ends_at?->toIso8601String(),
            'plan' => $planSlug ? [
                'slug' => $planSlug,
                'name' => $planName,
                'included_users' => $includedUsers,
            ] : null,
            'addons' => array_values(array_unique($addonSlugs)),
            'extra_users_quantity' => $extraUserQuantity,
            'current_users_count' => $currentUsers,
            'max_users' => $maxUsers,
            'can_add_more_users' => $canAddMoreUsers,
            'ends_at' => $subscription && $subscription->ends_at
                ? $subscription->ends_at->toIso8601String()
                : null,
        ];
    }

    /**
     * Crear sesión de Stripe Checkout para suscribirse a un plan.
     */
    public function createCheckoutSession(
        Business $business,
        string $planSlug,
        string $successUrl,
        string $cancelUrl,
        array $addonSlugs = []
    ): string {
        $plan = $this->getPlanBySlug($planSlug);
        $planPriceId = Arr::get($plan, 'stripe.id');
        if (! $plan || ! $planPriceId) {
            throw new \InvalidArgumentException("Plan no encontrado: {$planSlug}");
        }

        $builder = $business->newSubscription('default', $planPriceId);

        foreach ($addonSlugs as $slug) {
            $addon = $this->getAddonBySlug($slug);
            $addonPriceId = Arr::get($addon, 'stripe.id');
            if ($addon && $addonPriceId) {
                $builder->addPrice($addonPriceId);
            }
        }

        $checkout = $builder->checkout([
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
        ]);

        return $checkout->url;
    }

    /**
     * Crear sesión del portal de facturación de Stripe (gestionar pago, facturas, cancelar).
     */
    public function createBillingPortalSession(Business $business, string $returnUrl): string
    {
        return $business->redirectToBillingPortal($returnUrl)->getTargetUrl();
    }

    /**
     * Añadir un addon a la suscripción activa.
     */
    public function addAddon(Business $business, string $addonSlug): void
    {
        $addon = $this->getAddonBySlug($addonSlug);
        if (! $addon || empty($addon['stripe_price_id'])) {
            throw new \InvalidArgumentException("Addon no encontrado: {$addonSlug}");
        }

        $subscription = $business->subscription('default');
        if (! $subscription || ! $subscription->valid()) {
            throw new \RuntimeException('No hay una suscripción activa.');
        }

        $subscription->addPrice($addon['stripe_price_id']);
    }

    /**
     * Quitar un addon de la suscripción.
     */
    public function removeAddon(Business $business, string $addonSlug): void
    {
        $addon = $this->getAddonBySlug($addonSlug);
        if (! $addon || empty($addon['stripe_price_id'])) {
            throw new \InvalidArgumentException("Addon no encontrado: {$addonSlug}");
        }

        $subscription = $business->subscription('default');
        if (! $subscription || ! $subscription->valid()) {
            throw new \RuntimeException('No hay una suscripción activa.');
        }

        $subscription->removePrice($addon['stripe_price_id']);
    }

    /**
     * Establecer la cantidad de usuarios extra (slots adicionales de usuario).
     */
    public function setExtraUsers(Business $business, int $quantity): void
    {
        $priceId = $this->getExtraUserPriceId();
        if (! $priceId) {
            throw new \RuntimeException('No está configurado el precio de usuarios extra.');
        }

        if ($quantity < 0) {
            $quantity = 0;
        }

        $subscription = $business->subscription('default');
        if (! $subscription || ! $subscription->valid()) {
            throw new \RuntimeException('No hay una suscripción activa.');
        }

        $existingItem = $subscription->items->firstWhere('stripe_price', $priceId);
        if ($existingItem) {
            $subscription->updateQuantity($quantity, $priceId);
        } else {
            $subscription->addPrice($priceId, $quantity);
        }
    }
}
