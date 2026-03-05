<?php

namespace App\Repositories\Contracts;

use App\Models\CombinedService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CombinedServiceRepositoryInterface
{
    public function paginateForBusiness(int $businessId, ?int $branchId = null, int $perPage = 15): LengthAwarePaginator;

    public function findForBusiness(int $businessId, int $id): ?CombinedService;

    public function createForBusiness(int $businessId, array $data): CombinedService;

    public function update(CombinedService $combinedService, array $data): CombinedService;

    public function delete(CombinedService $combinedService): void;
}

