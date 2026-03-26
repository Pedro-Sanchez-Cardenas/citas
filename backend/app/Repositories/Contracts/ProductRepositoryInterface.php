<?php

namespace App\Repositories\Contracts;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ProductRepositoryInterface
{
    public function paginateForBusiness(int $businessId, int $perPage = 15): LengthAwarePaginator;

    public function findForBusiness(int $businessId, int $id): ?Product;

    /**
     * Filtra cuáles ids de productos pertenecen al negocio.
     *
     * @param int[] $ids
     * @return int[] ids válidos (únicos)
     */
    public function filterIdsForBusiness(int $businessId, array $ids): array;

    public function createForBusiness(int $businessId, array $data): Product;

    public function update(Product $product, array $data): Product;

    public function delete(Product $product): void;
}

