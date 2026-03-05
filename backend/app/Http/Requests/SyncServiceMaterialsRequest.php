<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SyncServiceMaterialsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'materials' => ['required', 'array', 'min:0'],
            'materials.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'materials.*.quantity' => ['required', 'numeric', 'min:0'],
        ];
    }
}

