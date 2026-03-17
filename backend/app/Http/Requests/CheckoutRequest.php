<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Services\SubscriptionService;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->business_id;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var SubscriptionService $subscriptionService */
        $subscriptionService = app(SubscriptionService::class);
        $planSlugs = array_keys($subscriptionService->getPlans());
        $addonSlugs = array_keys($subscriptionService->getAddons());

        return [
            'plan' => ['required', 'string', Rule::in($planSlugs)],
            'success_url' => ['required', 'string', 'url'],
            'cancel_url' => ['required', 'string', 'url'],
            'addons' => ['sometimes', 'array'],
            'addons.*' => ['string', Rule::in($addonSlugs)],
        ];
    }
}
