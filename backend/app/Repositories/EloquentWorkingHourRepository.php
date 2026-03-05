<?php

namespace App\Repositories;

use App\Models\WorkingHour;
use App\Repositories\Contracts\WorkingHourRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentWorkingHourRepository implements WorkingHourRepositoryInterface
{
    public function paginateForBusiness(
        int $businessId,
        ?int $branchId = null,
        ?int $professionalId = null,
        int $perPage = 50
    ): LengthAwarePaginator {
        return WorkingHour::query()
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->when($professionalId, fn ($q) => $q->where('professional_id', $professionalId))
            ->orderBy('weekday')
            ->orderBy('start_time')
            ->paginate($perPage);
    }

    public function findForBusiness(int $businessId, int $id): ?WorkingHour
    {
        return WorkingHour::query()
            ->where('business_id', $businessId)
            ->find($id);
    }

    public function createForBusiness(int $businessId, array $data): WorkingHour
    {
        $data['business_id'] = $businessId;

        return WorkingHour::create($data);
    }

    public function update(WorkingHour $workingHour, array $data): WorkingHour
    {
        $workingHour->fill($data);
        $workingHour->save();

        return $workingHour;
    }

    public function delete(WorkingHour $workingHour): void
    {
        $workingHour->delete();
    }
}

