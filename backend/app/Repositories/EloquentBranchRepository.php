<?php

namespace App\Repositories;

use App\Models\Branch;
use App\Repositories\Contracts\BranchRepositoryInterface;
use Illuminate\Support\Collection;

class EloquentBranchRepository implements BranchRepositoryInterface
{
    public function listForBusiness(int $businessId): Collection
    {
        return Branch::query()
            ->where('business_id', $businessId)
            ->orderBy('name')
            ->get();
    }

    public function getBranchesWithActiveServices(int $businessId): Collection
    {
        return Branch::query()
            ->where('business_id', $businessId)
            ->with(['services' => function ($q) {
                $q->where('is_active', true);
            }])
            ->get();
    }

    public function existsForBusiness(int $branchId, int $businessId): bool
    {
        return Branch::query()
            ->whereKey($branchId)
            ->where('business_id', $businessId)
            ->exists();
    }
}

