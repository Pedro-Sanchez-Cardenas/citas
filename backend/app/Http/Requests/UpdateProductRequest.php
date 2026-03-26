<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $param = $this->route('product');
        $productId = $param instanceof Product ? $param->getKey() : $param;

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'sku' => [
                'sometimes',
                'string',
                'max:100',
                Rule::unique('products', 'sku')->ignore($productId),
            ],
            'category' => ['sometimes', 'nullable', 'string', 'max:100'],
            'unit' => ['sometimes', 'nullable', 'string', 'max:20'],
            'cost_cents' => ['sometimes', 'integer', 'min:0'],
            'price_cents' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'is_reusable' => ['sometimes', 'boolean'],
        ];
    }
}
