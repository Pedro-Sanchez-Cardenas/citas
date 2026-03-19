<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClientRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['nullable', 'integer', 'exists:branches,id'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'birthday' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string'],
            'allergies' => ['nullable', 'string'],
            'preferences' => ['nullable', 'array'],
            'photo' => ['nullable', 'image', 'max:5120'], // 5 MB, opcional en multipart
        ];
    }
}

