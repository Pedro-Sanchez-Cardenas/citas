<?php

namespace App\Repositories;

use App\Models\ServiceCategory;
use App\Repositories\Contracts\ServiceCategoryRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentServiceCategoryRepository implements ServiceCategoryRepositoryInterface
{
    public function paginateForBusiness(int $businessId, int $perPage = 15): LengthAwarePaginator
    {
        return ServiceCategory::query()
            ->where('business_id', $businessId)
            ->orderBy('position')
            ->paginate($perPage);
    }

    public function findForBusiness(int $businessId, int $id): ?ServiceCategory
    {
        return ServiceCategory::query()
            ->where('business_id', $businessId)
            ->find($id);
    }

    public function createForBusiness(int $businessId, array $data): ServiceCategory
    {
        $data['business_id'] = $businessId;

        return ServiceCategory::create($data);
    }

    public function update(ServiceCategory $category, array $data): ServiceCategory
    {
        $category->fill($data);
        $category->save();

        return $category;
    }

    public function delete(ServiceCategory $category): void
    {
        $category->delete();
    }
}

