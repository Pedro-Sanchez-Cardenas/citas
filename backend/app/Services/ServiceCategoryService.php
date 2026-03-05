<?php

namespace App\Services;

use App\Models\ServiceCategory;
use App\Repositories\Contracts\ServiceCategoryRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ServiceCategoryService
{
    public function __construct(
        protected ServiceCategoryRepositoryInterface $categories
    ) {
    }

    public function listForBusiness(int $businessId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->categories->paginateForBusiness($businessId, $perPage);
    }

    public function createForBusiness(int $businessId, array $data): ServiceCategory
    {
        return $this->categories->createForBusiness($businessId, $data);
    }

    public function update(ServiceCategory $category, array $data): ServiceCategory
    {
        return $this->categories->update($category, $data);
    }

    public function delete(ServiceCategory $category): void
    {
        $this->categories->delete($category);
    }
}

