<?php

namespace App\Repositories;

use App\Models\Product;
use App\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentProductRepository implements ProductRepositoryInterface
{
    public function paginateForBusiness(int $businessId, int $perPage = 15): LengthAwarePaginator
    {
        return Product::query()
            ->where('business_id', $businessId)
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function findForBusiness(int $businessId, int $id): ?Product
    {
        return Product::query()
            ->where('business_id', $businessId)
            ->find($id);
    }

    public function createForBusiness(int $businessId, array $data): Product
    {
        $data['business_id'] = $businessId;

        return Product::create($data);
    }

    public function update(Product $product, array $data): Product
    {
        $product->fill($data);
        $product->save();

        return $product;
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }
}

