<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MoveAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after:start_at'],
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'professional_id' => ['nullable', 'integer', 'exists:professionals,id'],
        ];
    }
}

