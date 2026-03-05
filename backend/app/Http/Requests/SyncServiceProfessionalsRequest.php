<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SyncServiceProfessionalsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'professional_ids' => ['required', 'array', 'min:0'],
            'professional_ids.*' => ['integer', 'exists:professionals,id'],
        ];
    }
}

