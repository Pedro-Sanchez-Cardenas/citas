<?php

namespace App\Repositories\Contracts;

use App\Models\Automation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface AutomationRepositoryInterface
{
    public function paginateForBusiness(int $businessId, int $perPage = 15): LengthAwarePaginator;

    public function findForBusiness(int $businessId, int $id): ?Automation;

    public function createForBusiness(int $businessId, array $data): Automation;

    public function update(Automation $automation, array $data): Automation;

    public function delete(Automation $automation): void;
}

