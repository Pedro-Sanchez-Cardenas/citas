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
            'roles' => method_exists($this, 'getRoleNames') ? $this->getRoleNames()->toArray() : [],
            'permissions' => method_exists($this, 'getAllPermissions') ? $this->getAllPermissions()->pluck('name')->toArray() : [],
            'business' => $this->whenLoaded('business', fn () => [
                'id' => $this->business->id,
                'name' => $this->business->name,
            ]),
        ];
    }
}
