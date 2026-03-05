<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAutomationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'trigger' => ['required', 'in:appointment_reminder,inactive_client,birthday,promotion'],
            'conditions' => ['nullable', 'array'],
            'action' => ['nullable', 'array'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

