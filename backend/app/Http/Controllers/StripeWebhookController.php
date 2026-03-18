<?php

namespace App\Http\Controllers;

use Illuminate\Support\Carbon;
use Laravel\Cashier\Http\Controllers\WebhookController as CashierWebhookController;
use Stripe\Subscription as StripeSubscription;
use Symfony\Component\HttpFoundation\Response;

class StripeWebhookController extends CashierWebhookController
{
    /**
     * Corrige el bug de Cashier: cuando la suscripción está incomplete_expired
     * el controlador original hace return; sin devolver Response, causando 500.
     */
    protected function handleCustomerSubscriptionUpdated(array $payload): Response
    {
        if ($user = $this->getUserByStripeId($payload['data']['object']['customer'])) {
            $data = $payload['data']['object'];

            $subscription = $user->subscriptions()->firstOrNew(['stripe_id' => $data['id']]);

            if (
                isset($data['status']) &&
                $data['status'] === StripeSubscription::STATUS_INCOMPLETE_EXPIRED
            ) {
                $subscription->items()->delete();
                $subscription->delete();

                return $this->successMethod();
            }

            $subscription->type = $subscription->type ?? $data['metadata']['type'] ?? $data['metadata']['name'] ?? $this->newSubscriptionType($payload);

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

        return $this->successMethod();
    }
}
