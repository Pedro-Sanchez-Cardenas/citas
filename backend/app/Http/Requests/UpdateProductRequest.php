<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $productId = $this->route('product')?->id;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'sku' => ['sometimes', 'string', 'max:100', 'unique:products,sku,' . $productId],
            'category' => ['sometimes', 'nullable', 'string', 'max:100'],
            'unit' => ['sometimes', 'nullable', 'string', 'max:20'],
            'cost_cents' => ['sometimes', 'integer', 'min:0'],
            'price_cents' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'is_reusable' => ['sometimes', 'boolean'],
        ];
    }
}

