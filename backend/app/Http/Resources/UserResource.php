<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'roles' => $this->roles->pluck('name')->values()->toArray(),
            'permissions' => $this->permissions->pluck('name')->values()->toArray(),
            'professional_id' => $this->professional_id,
            'professional_branch_id' => $this->whenLoaded(
                'professional',
                fn () => $this->professional?->branch_id
            ),
            'business' => $this->whenLoaded(
                'business',
                fn() => [
                    'id' => $this->business->id,
                    'name' => $this->business->name,
                ],
            ),
        ];
    }
}
