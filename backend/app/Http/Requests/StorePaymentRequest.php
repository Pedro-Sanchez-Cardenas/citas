<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'client_id' => ['nullable', 'integer', 'exists:clients,id'],
            'method' => ['required', 'string', 'max:50'],
            'amount_cents' => ['required', 'integer', 'min:0'],
            'tip_cents' => ['nullable', 'integer', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'status' => ['nullable', 'in:pending,paid,failed,refunded'],
            'provider' => ['nullable', 'string', 'max:50'],
            'provider_payment_id' => ['nullable', 'string', 'max:255'],
            'meta' => ['nullable', 'array'],
        ];
    }
}

