<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['sometimes', 'integer', 'exists:branches,id'],
            'professional_id' => ['sometimes', 'integer', 'exists:professionals,id'],
            'service_id' => ['sometimes', 'nullable', 'integer', 'exists:services,id'],
            'combined_service_id' => ['sometimes', 'nullable', 'integer', 'exists:combined_services,id'],
            'client_name' => ['sometimes', 'string', 'max:255'],
            'client_phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'client_email' => ['sometimes', 'nullable', 'string', 'email', 'max:255'],
            'start_at' => ['sometimes', 'date'],
            'end_at' => ['sometimes', 'date', 'after:start_at'],
            'status' => ['sometimes', 'in:scheduled,confirmed,attended,cancelled,no_show'],
            'source' => ['sometimes', 'nullable', 'string', 'max:100'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ];
    }
}

