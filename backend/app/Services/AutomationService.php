<?php

namespace App\Services;

use App\Models\Automation;
use App\Repositories\Contracts\AutomationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class AutomationService
{
    public function __construct(
        protected AutomationRepositoryInterface $automations
    ) {
    }

    public function listForBusiness(int $businessId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->automations->paginateForBusiness($businessId, $perPage);
    }

    public function createForBusiness(int $businessId, array $data): Automation
    {
        return $this->automations->createForBusiness($businessId, $data);
    }

    public function update(Automation $automation, array $data): Automation
    {
        return $this->automations->update($automation, $data);
    }

    public function delete(Automation $automation): void
    {
        $this->automations->delete($automation);
    }
}

