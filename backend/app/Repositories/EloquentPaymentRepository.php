<?php

namespace App\Repositories;

use App\Models\Payment;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentPaymentRepository implements PaymentRepositoryInterface
{
    public function paginateForBusiness(int $businessId, ?int $branchId = null, int $perPage = 15): LengthAwarePaginator
    {
        return Payment::query()
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    public function findForBusiness(int $businessId, int $id): ?Payment
    {
        return Payment::query()
            ->where('business_id', $businessId)
            ->find($id);
    }

    public function createForBusiness(int $businessId, array $data): Payment
    {
        $data['business_id'] = $businessId;

        return Payment::create($data);
    }
}

