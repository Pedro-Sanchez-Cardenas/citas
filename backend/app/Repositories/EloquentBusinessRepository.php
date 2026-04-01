<?php

namespace App\Repositories;

use App\Models\Business;
use App\Models\BusinessBranding;
use App\Repositories\Contracts\BusinessRepositoryInterface;

class EloquentBusinessRepository implements BusinessRepositoryInterface
{
    public function findById(int $id): ?Business
    {
        return Business::query()->find($id);
    }

    public function findBySlug(string $slug): ?Business
    {
        return Business::query()->where('slug', $slug)->first();
    }

    public function findBySlugOrFail(string $slug): Business
    {
        return Business::query()->where('slug', $slug)->firstOrFail();
    }

    public function upsertBranding(Business $business, array $attributes): BusinessBranding
    {
        return BusinessBranding::query()->updateOrCreate(
            ['business_id' => $business->id],
            $attributes
        );
    }
}
