<?php

namespace App\Repositories\Contracts;

use App\Models\ServiceCategory;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ServiceCategoryRepositoryInterface
{
    public function paginateForBusiness(int $businessId, int $perPage = 15): LengthAwarePaginator;

    public function findForBusiness(int $businessId, int $id): ?ServiceCategory;

    public function createForBusiness(int $businessId, array $data): ServiceCategory;

    public function update(ServiceCategory $category, array $data): ServiceCategory;

    public function delete(ServiceCategory $category): void;
}

