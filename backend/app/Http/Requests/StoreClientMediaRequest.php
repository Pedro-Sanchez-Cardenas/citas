<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClientMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'type' => ['nullable', 'string', 'in:before,after,other'],
            'url' => ['required', 'string', 'max:2048'],
            'notes' => ['nullable', 'string'],
        ];
    }
}

