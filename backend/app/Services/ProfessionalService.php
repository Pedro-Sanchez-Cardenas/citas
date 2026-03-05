<?php

namespace App\Services;

use App\Models\Professional;
use App\Repositories\Contracts\ProfessionalRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ProfessionalService
{
    public function __construct(
        protected ProfessionalRepositoryInterface $professionals
    ) {
    }

    public function listForBusiness(int $businessId, ?int $branchId = null, int $perPage = 15): LengthAwarePaginator
    {
        return $this->professionals->paginateForBusiness($businessId, $branchId, $perPage);
    }

    public function createForBusiness(int $businessId, array $data): Professional
    {
        return $this->professionals->createForBusiness($businessId, $data);
    }

    public function update(Professional $professional, array $data): Professional
    {
        return $this->professionals->update($professional, $data);
    }

    public function delete(Professional $professional): void
    {
        $this->professionals->delete($professional);
    }
}

