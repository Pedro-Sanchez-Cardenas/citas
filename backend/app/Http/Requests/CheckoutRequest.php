<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
        $planSlugs = array_keys(config('subscription.plans', []));
        $addonSlugs = array_keys(config('subscription.addons', []));

        return [
            'plan' => ['required', 'string', Rule::in($planSlugs)],
            'success_url' => ['required', 'string', 'url'],
            'cancel_url' => ['required', 'string', 'url'],
            'addons' => ['sometimes', 'array'],
            'addons.*' => ['string', Rule::in($addonSlugs)],
        ];
    }
}
