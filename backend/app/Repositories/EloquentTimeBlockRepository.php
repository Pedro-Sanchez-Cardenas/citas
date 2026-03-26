<?php

namespace App\Repositories;

use App\Models\Branch;
use App\Models\Professional;
use App\Models\TimeBlock;
use App\Repositories\Contracts\TimeBlockRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentTimeBlockRepository implements TimeBlockRepositoryInterface
{
    public function paginateForBusiness(
        int $businessId,
        ?int $branchId = null,
        ?int $professionalId = null,
        int $perPage = 50
    ): LengthAwarePaginator {
        $query = TimeBlock::query()
            ->whereHas('branch', fn ($q) => $q->where('business_id', $businessId))
            // Nuestro flujo de creación exige branch_id, así que filtramos para mantener consistencia.
            ->where('branch_id', '!=', null);

        if ($branchId !== null) {
            $query->where('branch_id', (int) $branchId);
        }

        if ($professionalId !== null) {
            $query->where('professional_id', (int) $professionalId);
        }

        return $query
            ->orderBy('start_at')
            ->paginate($perPage);
    }

    public function createForBusiness(int $businessId, array $data): TimeBlock
    {
        $data['business_id'] = $businessId;

        return TimeBlock::create($data);
    }

    public function blockBelongsToBusiness(int $businessId, TimeBlock $block): bool
    {
        return $block->branch()
            ->where('business_id', $businessId)
            ->exists();
    }

    public function belongsToBusiness(int $businessId, int $branchId, ?int $professionalId): bool
    {
        $branchValid = Branch::query()
            ->whereKey($branchId)
            ->where('business_id', $businessId)
            ->exists();

        if (! $branchValid) {
            return false;
        }

        if (! $professionalId) {
            return true;
        }

        return Professional::query()
            ->whereKey($professionalId)
            ->where('business_id', $businessId)
            ->where('branch_id', $branchId)
            ->exists();
    }

    public function delete(TimeBlock $block): void
    {
        $block->delete();
    }
}

