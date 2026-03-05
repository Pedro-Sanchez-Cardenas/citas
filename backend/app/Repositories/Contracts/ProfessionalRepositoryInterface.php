<?php

namespace App\Repositories\Contracts;

use App\Models\Professional;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ProfessionalRepositoryInterface
{
    public function paginateForBusiness(int $businessId, ?int $branchId = null, int $perPage = 15): LengthAwarePaginator;

    public function findForBusiness(int $businessId, int $id): ?Professional;

    public function createForBusiness(int $businessId, array $data): Professional;

    public function update(Professional $professional, array $data): Professional;

    public function delete(Professional $professional): void;
}

