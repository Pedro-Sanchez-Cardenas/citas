<?php

namespace App\Repositories\Contracts;

use App\Models\WorkingHour;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface WorkingHourRepositoryInterface
{
    public function paginateForBusiness(
        int $businessId,
        ?int $branchId = null,
        ?int $professionalId = null,
        int $perPage = 50
    ): LengthAwarePaginator;

    public function findForBusiness(int $businessId, int $id): ?WorkingHour;

    public function createForBusiness(int $businessId, array $data): WorkingHour;

    public function update(WorkingHour $workingHour, array $data): WorkingHour;

    public function delete(WorkingHour $workingHour): void;
}

