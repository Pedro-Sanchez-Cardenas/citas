<?php

namespace App\Services;

use App\Models\Business;
use Illuminate\Support\Arr;

class SubscriptionService
{
    public function getPlans(): array
    {
        return config('subscription.plans', []);
    }

    public function getAddons(): array
    {
        return config('subscription.addons', []);
    }

    public function getExtraUserPriceId(): ?string
    {
        return config('subscription.extra_user.stripe_price_id');
    }

    public function getPlanBySlug(string $slug): ?array
    {
        return Arr::get(config('subscription.plans'), $slug);
    }

    public function getAddonBySlug(string $slug): ?array
    {
        return Arr::get(config('subscription.addons'), $slug);
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
            $plansConfig = config('subscription.plans', []);
            $addonsConfig = config('subscription.addons', []);

            foreach ($subscription->items as $item) {
                $priceId = $item->stripe_price;
                if ($priceId === $extraUserPriceId) {
                    $extraUserQuantity = (int) $item->quantity;
                    continue;
                }
                foreach ($plansConfig as $slug => $plan) {
                    if (($plan['stripe_price_id'] ?? null) === $priceId) {
                        $planSlug = $slug;
                        $planName = $plan['name'] ?? $slug;
                        $includedUsers = (int) ($plan['included_users'] ?? 0);
                        continue 2;
                    }
                }
                foreach ($addonsConfig as $slug => $addon) {
                    if (($addon['stripe_price_id'] ?? null) === $priceId) {
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
        if (! $plan || empty($plan['stripe_price_id'])) {
            throw new \InvalidArgumentException("Plan no encontrado: {$planSlug}");
        }

        $builder = $business->newSubscription('default', $plan['stripe_price_id']);

        foreach ($addonSlugs as $slug) {
            $addon = $this->getAddonBySlug($slug);
            if ($addon && ! empty($addon['stripe_price_id'])) {
                $builder->addPrice($addon['stripe_price_id']);
            }
        }

        $checkout = $builder->checkout($successUrl, $cancelUrl);

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
