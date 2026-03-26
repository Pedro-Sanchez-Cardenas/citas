<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTimeBlockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'branch_id' => ['required', 'integer', 'exists:branches,id'],
            'professional_id' => ['nullable', 'integer', 'exists:professionals,id'],
            // Payload legacy o actual:
            // - "dates" es un rango de fechas (DatePicker mode="range") que convertimos en backend.
            // - "start_at"/"end_at" son datetime directos.
            'dates' => ['required_without_all:start_at,end_at', 'array', 'size:2'],
            'dates.0' => ['required_with:dates', 'date'],
            'dates.1' => ['required_with:dates', 'date', 'after_or_equal:dates.0'],

            'start_at' => ['nullable', 'date', 'required_without:dates'],
            'end_at' => ['nullable', 'date', 'required_without:dates', 'after_or_equal:start_at'],

            'reason' => ['nullable', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'max:100'],
        ];
    }

    protected function prepareForValidation(): void
    {
        // El frontend a veces manda `dates: null`; lo tratamos como ausente
        // para que las reglas required_without/required_without_all funcionen bien.
        if (is_null($this->input('dates'))) {
            $this->request->remove('dates');
        }

        // Normalizar cadenas vacías.
        if ($this->has('reason') && is_string($this->input('reason')) && trim($this->input('reason')) === '') {
            $this->merge(['reason' => null]);
        }

        if ($this->has('type') && is_string($this->input('type')) && trim($this->input('type')) === '') {
            $this->merge(['type' => null]);
        }
    }
}
