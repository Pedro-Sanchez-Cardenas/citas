<?php

namespace App\Repositories\Contracts;

use App\Models\ProductStock;
use Illuminate\Support\Collection;

interface ProductStockRepositoryInterface
{
    public function getForBranch(int $businessId, int $branchId): Collection;

    public function findForBranch(int $businessId, int $branchId, int $productId): ?ProductStock;

    public function save(ProductStock $stock): ProductStock;
}

