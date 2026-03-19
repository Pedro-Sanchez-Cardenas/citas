<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_id' => $this->business_id,
            'branch_id' => $this->branch_id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'birthday' => $this->birthday?->format('Y-m-d'),
            'gender' => $this->gender,
            'notes' => $this->notes,
            'allergies' => $this->allergies,
            'photo_path' => $this->photo_path,
            'photo_url' => $this->photo_path ? '/storage/' . ltrim($this->photo_path, '/') : null,
            'preferences' => $this->preferences,
            'last_visit_at' => $this->last_visit_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
