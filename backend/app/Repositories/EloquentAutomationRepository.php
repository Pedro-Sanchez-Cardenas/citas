<?php

namespace App\Repositories;

use App\Models\Automation;
use App\Repositories\Contracts\AutomationRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentAutomationRepository implements AutomationRepositoryInterface
{
    public function paginateForBusiness(int $businessId, int $perPage = 15): LengthAwarePaginator
    {
        return Automation::query()
            ->where('business_id', $businessId)
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function findForBusiness(int $businessId, int $id): ?Automation
    {
        return Automation::query()
            ->where('business_id', $businessId)
            ->find($id);
    }

    public function createForBusiness(int $businessId, array $data): Automation
    {
        $data['business_id'] = $businessId;

        return Automation::create($data);
    }

    public function update(Automation $automation, array $data): Automation
    {
        $automation->fill($data);
        $automation->save();

        return $automation;
    }

    public function delete(Automation $automation): void
    {
        $automation->delete();
    }
}

