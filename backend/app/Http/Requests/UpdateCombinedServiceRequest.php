<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCombinedServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('combined_service')?->id;

        return [
            'branch_id' => ['sometimes', 'nullable', 'integer', 'exists:branches,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'code' => ['sometimes', 'string', 'max:50', 'unique:combined_services,code,' . $id],
            'total_duration_minutes' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'is_active' => ['sometimes', 'boolean'],
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.service_id' => ['required_with:items', 'integer', 'exists:services,id'],
            'items.*.position' => ['nullable', 'integer', 'min:1'],
            'items.*.offset_minutes' => ['nullable', 'integer', 'min:0'],
            'items.*.duration_minutes' => ['nullable', 'integer', 'min:1'],
        ];
    }
}

