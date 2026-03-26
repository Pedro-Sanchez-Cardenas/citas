<?php

namespace App\Repositories\Contracts;

use App\Models\Business;

interface BusinessRepositoryInterface
{
    public function findById(int $id): ?Business;

    public function findBySlug(string $slug): ?Business;

    public function findBySlugOrFail(string $slug): Business;

    /**
     * @param  array<string, mixed>  $settings
     */
    public function updateSettings(Business $business, array $settings): Business;
}
