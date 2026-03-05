<?php

namespace App\Repositories;

use App\Models\ProductStock;
use App\Repositories\Contracts\ProductStockRepositoryInterface;
use Illuminate\Support\Collection;

class EloquentProductStockRepository implements ProductStockRepositoryInterface
{
    public function getForBranch(int $businessId, int $branchId): Collection
    {
        return ProductStock::query()
            ->where('business_id', $businessId)
            ->where('branch_id', $branchId)
            ->with('product')
            ->get();
    }

    public function findForBranch(int $businessId, int $branchId, int $productId): ?ProductStock
    {
        return ProductStock::query()
            ->where('business_id', $businessId)
            ->where('branch_id', $branchId)
            ->where('product_id', $productId)
            ->first();
    }

    public function save(ProductStock $stock): ProductStock
    {
        $stock->save();

        return $stock;
    }
}

