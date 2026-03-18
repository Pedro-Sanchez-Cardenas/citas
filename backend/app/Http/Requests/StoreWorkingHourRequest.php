<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkingHourRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'professional_id' => ['nullable', 'integer', 'exists:professionals,id'],
            'weekday' => ['required', 'array', 'min:1'],
            'weekday.*' => ['integer', 'min:0', 'max:6'],
            'hours' => ['required', 'array', 'min:1'],
            'hours.*.start_time' => ['required'],
            'hours.*.end_time' => ['required', 'after:hours.*.start_time'],
            'effective_from' => ['nullable', 'date'],
            'effective_until' => ['nullable', 'date', 'after_or_equal:effective_from'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

