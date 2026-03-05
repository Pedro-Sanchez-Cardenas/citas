<?php

namespace App\Services;

use App\Models\Service;
use App\Repositories\Contracts\ServiceRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ServiceService
{
    public function __construct(
        protected ServiceRepositoryInterface $services
    ) {
    }

    public function listForBusiness(int $businessId, ?int $branchId = null, int $perPage = 15): LengthAwarePaginator
    {
        return $this->services->paginateForBusiness($businessId, $branchId, $perPage);
    }

    public function createForBusiness(int $businessId, array $data): Service
    {
        return $this->services->createForBusiness($businessId, $data);
    }

    public function update(Service $service, array $data): Service
    {
        return $this->services->update($service, $data);
    }

    public function delete(Service $service): void
    {
        $this->services->delete($service);
    }
}

