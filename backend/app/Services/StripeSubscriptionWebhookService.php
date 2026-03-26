<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Carbon;
use Stripe\Subscription as StripeSubscription;

class StripeSubscriptionWebhookService
{
    /**
     * Sincroniza estado de suscripción desde Stripe (incluye incomplete_expired).
     */
    public function syncCustomerSubscriptionFromPayload(User $user, array $payload): void
    {
        $data = $payload['data']['object'];

        $subscription = $user->subscriptions()->firstOrNew(['stripe_id' => $data['id']]);

        if (
            isset($data['status']) &&
            $data['status'] === StripeSubscription::STATUS_INCOMPLETE_EXPIRED
        ) {
            $subscription->items()->delete();
            $subscription->delete();

            return;
        }

        $subscription->type = $subscription->type ?? $data['metadata']['type'] ?? $data['metadata']['name'] ?? 'default';

        $firstItem = $data['items']['data'][0];
        $isSinglePrice = count($data['items']['data']) === 1;

        $subscription->stripe_price = $isSinglePrice ? $firstItem['price']['id'] : null;
        $subscription->quantity = $isSinglePrice && isset($firstItem['quantity']) ? $firstItem['quantity'] : null;

        if (isset($data['trial_end'])) {
            $trialEnd = Carbon::createFromTimestamp($data['trial_end']);
            if (! $subscription->trial_ends_at || $subscription->trial_ends_at->ne($trialEnd)) {
                $subscription->trial_ends_at = $trialEnd;
            }
        }

        if ($data['cancel_at_period_end'] ?? false) {
            $subscription->ends_at = $subscription->onTrial()
                ? $subscription->trial_ends_at
                : Carbon::createFromTimestamp($data['current_period_end']);
        } elseif (isset($data['cancel_at']) || isset($data['canceled_at'])) {
            $subscription->ends_at = Carbon::createFromTimestamp($data['cancel_at'] ?? $data['canceled_at']);
        } else {
            $subscription->ends_at = null;
        }

        if (isset($data['status'])) {
            $subscription->stripe_status = $data['status'];
        }

        $subscription->save();

        if (isset($data['items'])) {
            $subscriptionItemIds = [];
            foreach ($data['items']['data'] as $item) {
                $subscriptionItemIds[] = $item['id'];
                $subscription->items()->updateOrCreate(
                    ['stripe_id' => $item['id']],
                    [
                        'stripe_product' => $item['price']['product'],
                        'stripe_price' => $item['price']['id'],
                        'quantity' => $item['quantity'] ?? null,
                    ]
                );
            }
            $subscription->items()->whereNotIn('stripe_id', $subscriptionItemIds)->delete();
        }
    }
}
