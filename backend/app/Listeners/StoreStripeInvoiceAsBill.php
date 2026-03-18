<?php

namespace App\Listeners;

use App\Models\Bill;
use Laravel\Cashier\Cashier;
use Laravel\Cashier\Events\WebhookHandled;

class StoreStripeInvoiceAsBill
{
    /**
     * Guardar factura de Stripe como Bill cuando llega invoice.paid o invoice.payment_succeeded.
     */
    public function handle(WebhookHandled $event): void
    {
        $type = $event->payload['type'] ?? null;
        if (! in_array($type, ['invoice.paid', 'invoice.payment_succeeded'], true)) {
            return;
        }

        $invoice = $event->payload['data']['object'] ?? null;
        if (! $invoice || empty($invoice['id'])) {
            return;
        }

        $customerStripeId = $invoice['customer'] ?? null;
        if (! $customerStripeId) {
            return;
        }

        $business = Cashier::findBillable($customerStripeId);
        if (! $business) {
            return;
        }

        $amount = (int) ($invoice['amount_paid'] ?? $invoice['amount_due'] ?? 0);
        $currency = strtolower($invoice['currency'] ?? 'usd');
        $stripeStatus = $invoice['status'] ?? null;
        $invoicePdf = $invoice['invoice_pdf'] ?? null;
        $paidAt = isset($invoice['status_transitions']['paid_at'])
            ? date('Y-m-d H:i:s', $invoice['status_transitions']['paid_at'])
            : null;

        Bill::updateOrCreate(
            ['stripe_invoice_id' => $invoice['id']],
            [
                'business_id' => $business->id,
                'amount' => $amount,
                'currency' => $currency,
                'stripe_status' => $stripeStatus,
                'invoice_pdf' => $invoicePdf,
                'paid_at' => $paidAt,
            ]
        );
    }
}
