<?php

namespace App\Http\Controllers;

use App\Services\StripeSubscriptionWebhookService;
use Laravel\Cashier\Http\Controllers\WebhookController as CashierWebhookController;
use Symfony\Component\HttpFoundation\Response;

class StripeWebhookController extends CashierWebhookController
{
    public function __construct(
        protected StripeSubscriptionWebhookService $stripeSubscriptionWebhookService
    ) {
        parent::__construct();
    }

    /**
     * Corrige el bug de Cashier: cuando la suscripción está incomplete_expired
     * el controlador original hace return; sin devolver Response, causando 500.
     */
    protected function handleCustomerSubscriptionUpdated(array $payload): Response
    {
        if ($user = $this->getUserByStripeId($payload['data']['object']['customer'])) {
            $this->stripeSubscriptionWebhookService->syncCustomerSubscriptionFromPayload($user, $payload);
        }

        return $this->successMethod();
    }
}
