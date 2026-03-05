<?php

namespace App\Services;

use App\Models\WorkingHour;
use App\Repositories\Contracts\WorkingHourRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class WorkingHourService
{
    public function __construct(
        protected WorkingHourRepositoryInterface $workingHours
    ) {
    }

    public function listForBusiness(
        int $businessId,
        ?int $branchId = null,
        ?int $professionalId = null,
        int $perPage = 50
    ): LengthAwarePaginator {
        return $this->workingHours->paginateForBusiness($businessId, $branchId, $professionalId, $perPage);
    }

    public function createForBusiness(int $businessId, array $data): WorkingHour
    {
        return $this->workingHours->createForBusiness($businessId, $data);
    }

    public function update(WorkingHour $workingHour, array $data): WorkingHour
    {
        return $this->workingHours->update($workingHour, $data);
    }

    public function delete(WorkingHour $workingHour): void
    {
        $this->workingHours->delete($workingHour);
    }
}

