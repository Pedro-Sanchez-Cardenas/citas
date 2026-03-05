<?php

namespace App\Repositories;

use App\Models\Service;
use App\Repositories\Contracts\ServiceRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentServiceRepository implements ServiceRepositoryInterface
{
    public function paginateForBusiness(int $businessId, ?int $branchId = null, int $perPage = 15): LengthAwarePaginator
    {
        return Service::query()
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function findForBusiness(int $businessId, int $id): ?Service
    {
        return Service::query()
            ->where('business_id', $businessId)
            ->find($id);
    }

    public function createForBusiness(int $businessId, array $data): Service
    {
        $data['business_id'] = $businessId;

        return Service::create($data);
    }

    public function update(Service $service, array $data): Service
    {
        $service->fill($data);
        $service->save();

        return $service;
    }

    public function delete(Service $service): void
    {
        $service->delete();
    }
}

