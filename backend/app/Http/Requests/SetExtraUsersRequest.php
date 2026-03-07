<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SetExtraUsersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->business_id;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'quantity' => ['required', 'integer', 'min:0', 'max:999'],
        ];
    }
}
