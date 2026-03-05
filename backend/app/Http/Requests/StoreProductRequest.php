<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['required', 'string', 'max:100', 'unique:products,sku'],
            'category' => ['nullable', 'string', 'max:100'],
            'unit' => ['nullable', 'string', 'max:20'],
            'cost_cents' => ['nullable', 'integer', 'min:0'],
            'price_cents' => ['nullable', 'integer', 'min:0'],
            'is_reusable' => ['sometimes', 'boolean'],
        ];
    }
}

