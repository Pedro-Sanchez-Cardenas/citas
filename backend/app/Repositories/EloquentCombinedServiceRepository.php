<?php

namespace App\Repositories;

use App\Models\CombinedService;
use App\Repositories\Contracts\CombinedServiceRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentCombinedServiceRepository implements CombinedServiceRepositoryInterface
{
    public function paginateForBusiness(int $businessId, ?int $branchId = null, int $perPage = 15): LengthAwarePaginator
    {
        return CombinedService::query()
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function findForBusiness(int $businessId, int $id): ?CombinedService
    {
        return CombinedService::query()
            ->where('business_id', $businessId)
            ->with('items')
            ->find($id);
    }

    public function createForBusiness(int $businessId, array $data): CombinedService
    {
        $data['business_id'] = $businessId;

        return CombinedService::create($data);
    }

    public function update(CombinedService $combinedService, array $data): CombinedService
    {
        $combinedService->fill($data);
        $combinedService->save();

        return $combinedService;
    }

    public function delete(CombinedService $combinedService): void
    {
        $combinedService->delete();
    }
}

