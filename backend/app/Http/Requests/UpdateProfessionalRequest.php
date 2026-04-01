<?php

namespace App\Http\Requests;

use App\Models\Professional;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfessionalRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user?->hasPermissionTo('manage_professionals') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $email = $this->input('email');
        if ($email === '' || $email === null) {
            $this->merge(['email' => null]);
        } elseif (is_string($email)) {
            $this->merge(['email' => trim($email)]);
        }
    }

    public function rules(): array
    {
        $param = $this->route('professional');
        $professionalId = $param instanceof Professional ? $param->getKey() : $param;
        $updateWorkerCredentials = (bool) $this->boolean('update_worker_credentials')
            || (bool) $this->boolean('update_worker_password');

        $professional = $param instanceof Professional ? $param : null;
        if ($professional instanceof Professional) {
            $professional->loadMissing('user');
        }
        $hasWorkerUser = $professional instanceof Professional && $professional->user !== null;

        return [
            'branch_id' => ['sometimes', 'integer', 'exists:branches,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => [
                Rule::excludeIf(fn () => ! $this->boolean('update_worker_credentials') && ! $this->boolean('update_worker_password')),
                'sometimes',
                $hasWorkerUser ? 'required' : 'nullable',
                'string',
                'email',
                'max:255',
                Rule::unique('professionals', 'email')->ignore($professionalId),
            ],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'color' => ['sometimes', 'nullable', 'string', 'max:20'],
            'commission_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'base_salary_cents' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'photo' => ['sometimes', 'nullable', 'image', 'max:5120'],
            'update_worker_credentials' => ['sometimes', 'boolean'],
            'update_worker_password' => ['sometimes', 'boolean'],
            'worker_password' => [
                $updateWorkerCredentials ? 'required' : 'nullable',
                'string',
                'min:8',
                'max:255',
            ],
        ];
    }
}
