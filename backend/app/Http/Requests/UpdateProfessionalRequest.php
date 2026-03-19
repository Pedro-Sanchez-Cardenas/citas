<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfessionalRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user?->hasPermissionTo('manage_professionals') ?? false;
    }

    public function rules(): array
    {
        $professionalId = $this->route('professional')?->id;
        $updateWorkerPassword = (bool) $this->boolean('update_worker_password');

        return [
            'branch_id' => ['sometimes', 'integer', 'exists:branches,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'nullable', 'string', 'email', 'max:255', 'unique:professionals,email,' . $professionalId],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'color' => ['sometimes', 'nullable', 'string', 'max:20'],
            'commission_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'base_salary_cents' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'photo' => ['sometimes', 'nullable', 'image', 'max:5120'],
            'update_worker_password' => ['sometimes', 'boolean'],
            'worker_password' => [
                $updateWorkerPassword ? 'required' : 'nullable',
                'string',
                'min:8',
                'max:255',
            ],
        ];
    }
}

