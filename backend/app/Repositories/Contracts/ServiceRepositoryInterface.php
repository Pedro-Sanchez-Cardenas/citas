<?php

namespace App\Repositories\Contracts;

use App\Models\Service;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ServiceRepositoryInterface
{
    public function paginateForBusiness(int $businessId, ?int $branchId = null, int $perPage = 15): LengthAwarePaginator;

    public function findForBusiness(int $businessId, int $id): ?Service;

    public function createForBusiness(int $businessId, array $data): Service;

    public function update(Service $service, array $data): Service;

    public function delete(Service $service): void;
}

