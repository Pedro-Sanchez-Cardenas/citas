<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkingHourRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['sometimes', 'nullable', 'integer', 'exists:branches,id'],
            'professional_id' => ['sometimes', 'nullable', 'integer', 'exists:professionals,id'],
            'weekday' => ['sometimes', 'array', 'min:1'],
            'weekday.*' => ['integer', 'min:0', 'max:6'],
            'hours' => ['sometimes', 'array', 'min:1'],
            'hours.*.start_time' => ['required_with:hours'],
            'hours.*.end_time' => ['required_with:hours', 'after:hours.*.start_time'],
            'effective_from' => ['sometimes', 'nullable', 'date'],
            'effective_until' => ['sometimes', 'nullable', 'date', 'after_or_equal:effective_from'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}

