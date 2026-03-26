<?php

namespace App\Repositories\Contracts;

use App\Models\TimeBlock;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface TimeBlockRepositoryInterface
{
    public function paginateForBusiness(
        int $businessId,
        ?int $branchId = null,
        ?int $professionalId = null,
        int $perPage = 50
    ): LengthAwarePaginator;

    public function createForBusiness(int $businessId, array $data): TimeBlock;

    public function blockBelongsToBusiness(int $businessId, TimeBlock $block): bool;

    public function belongsToBusiness(int $businessId, int $branchId, ?int $professionalId): bool;

    public function delete(TimeBlock $block): void;
}

