<?php

namespace App\Repositories;

use App\Models\Professional;
use App\Repositories\Contracts\ProfessionalRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentProfessionalRepository implements ProfessionalRepositoryInterface
{
    public function paginateForBusiness(int $businessId, ?int $branchId = null, int $perPage = 15): LengthAwarePaginator
    {
        return Professional::query()
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function findForBusiness(int $businessId, int $id): ?Professional
    {
        return Professional::query()
            ->where('business_id', $businessId)
            ->find($id);
    }

    public function createForBusiness(int $businessId, array $data): Professional
    {
        $data['business_id'] = $businessId;

        return Professional::create($data);
    }

    public function update(Professional $professional, array $data): Professional
    {
        $professional->fill($data);
        $professional->save();

        return $professional;
    }

    public function delete(Professional $professional): void
    {
        $professional->delete();
    }
}

