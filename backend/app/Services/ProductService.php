<?php

namespace App\Services;

use App\Models\Product;
use App\Repositories\Contracts\ProductRepositoryInterface;

class ProductService
{
    public function __construct(
        protected ProductRepositoryInterface $products
    ) {
    }

    /**
     * Devuelve ids válidos de productos que pertenecen al negocio.
     *
     * @param int[] $ids
     * @return int[]
     */
    public function filterIdsForBusiness(int $businessId, array $ids): array
    {
        return $this->products->filterIdsForBusiness($businessId, $ids);
    }

    public function findForBusiness(int $businessId, int $id): ?Product
    {
        return $this->products->findForBusiness($businessId, $id);
    }
}

