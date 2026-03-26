<?php

namespace App\Http\Requests;

use App\Models\CombinedService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCombinedServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $param = $this->route('combined_service');
        $id = $param instanceof CombinedService ? $param->getKey() : $param;

        return [
            'branch_id' => ['sometimes', 'nullable', 'integer', 'exists:branches,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'code' => [
                'sometimes',
                'string',
                'max:50',
                Rule::unique('combined_services', 'code')->ignore($id),
            ],
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
