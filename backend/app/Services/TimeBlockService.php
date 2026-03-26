<?php

namespace App\Services;

use App\Models\TimeBlock;
use App\Repositories\Contracts\TimeBlockRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TimeBlockService
{
    public function __construct(
        protected TimeBlockRepositoryInterface $timeBlocks
    ) {
    }

    public function listForBusiness(
        int $businessId,
        ?int $branchId = null,
        ?int $professionalId = null,
        int $perPage = 50
    ): LengthAwarePaginator {
        return $this->timeBlocks->paginateForBusiness($businessId, $branchId, $professionalId, $perPage);
    }

    public function canCreateForBusiness(int $businessId, int $branchId, ?int $professionalId): bool
    {
        return $this->timeBlocks->belongsToBusiness($businessId, $branchId, $professionalId);
    }

    public function canAccessBlock(int $businessId, TimeBlock $block): bool
    {
        return $this->timeBlocks->blockBelongsToBusiness($businessId, $block);
    }

    public function deleteForBusiness(int $businessId, TimeBlock $block): void
    {
        if (! $this->canAccessBlock($businessId, $block)) {
            abort(404);
        }

        $this->timeBlocks->delete($block);
    }

    public function createForBusiness(int $businessId, array $data): TimeBlock
    {
        $data = $this->normalizePayload($data);

        return $this->timeBlocks->createForBusiness($businessId, $data);
    }

    /**
     * Normaliza el payload para que TimeBlock reciba siempre:
     * - start_at / end_at (datetime)
     *
     * Si viene `dates` (rango de fechas), lo convertimos a:
     * - start_at = inicio del día de dates[0]
     * - end_at = fin del día de dates[1]
     */
    protected function normalizePayload(array $data): array
    {
        // Si viene el rango de fechas, convertirlo a start_at/end_at.
        if (array_key_exists('dates', $data) && is_array($data['dates']) && count($data['dates']) === 2) {
            $start = CarbonImmutable::parse((string) $data['dates'][0])->startOfDay();
            $end = CarbonImmutable::parse((string) $data['dates'][1])->endOfDay();

            $data['start_at'] = $start->toIso8601String();
            $data['end_at'] = $end->toIso8601String();

            unset($data['dates']);
        }

        // Si vienen cadenas vacías, no las persistimos.
        if (array_key_exists('reason', $data) && is_string($data['reason']) && trim($data['reason']) === '') {
            unset($data['reason']);
        }

        if (array_key_exists('type', $data) && (is_null($data['type']) || (is_string($data['type']) && trim($data['type']) === ''))) {
            unset($data['type']);
        }

        // Aseguramos que `professional_id` venga como null o int.
        if (Arr::exists($data, 'professional_id') && ! is_null($data['professional_id'])) {
            $data['professional_id'] = (int) $data['professional_id'];
        }

        return $data;
    }
}

