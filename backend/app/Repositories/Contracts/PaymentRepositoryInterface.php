<?php

namespace App\Repositories\Contracts;

use App\Models\Payment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface PaymentRepositoryInterface
{
    public function paginateForBusiness(int $businessId, ?int $branchId = null, int $perPage = 15): LengthAwarePaginator;

    public function findForBusiness(int $businessId, int $id): ?Payment;

    public function createForBusiness(int $businessId, array $data): Payment;
}

