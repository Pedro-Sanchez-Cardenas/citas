<?php

namespace App\Repositories;

use App\Models\Business;
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

    public function updateSettings(Business $business, array $settings): Business
    {
        $business->settings = $settings;
        $business->save();

        return $business;
    }
}
