<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProfessionalRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user?->hasPermissionTo('manage_professionals') ?? false;
    }

    public function rules(): array
    {
        $createWorkerUser = (bool) $this->boolean('create_worker_user');

        return [
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                $createWorkerUser ? 'required' : 'nullable',
                'string',
                'email',
                'max:255',
                'unique:professionals,email',
            ],
            'phone' => ['nullable', 'string', 'max:50'],
            'color' => ['nullable', 'string', 'max:20'],
            'commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'base_salary_cents' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'photo' => ['nullable', 'image', 'max:5120'],

            'create_worker_user' => ['sometimes', 'boolean'],
            'worker_password' => [
                $createWorkerUser ? 'required' : 'nullable',
                'string',
                'min:8',
                'max:255',
            ],
        ];
    }
}

