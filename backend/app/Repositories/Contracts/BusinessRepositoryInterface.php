<?php

namespace App\Repositories\Contracts;

use App\Models\Business;
use App\Models\BusinessBranding;

interface BusinessRepositoryInterface
{
    public function findById(int $id): ?Business;

    public function findBySlug(string $slug): ?Business;

    public function findBySlugOrFail(string $slug): Business;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function upsertBranding(Business $business, array $attributes): BusinessBranding;
}
