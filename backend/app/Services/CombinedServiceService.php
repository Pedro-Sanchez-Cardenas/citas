<?php

namespace App\Services;

use App\Models\CombinedService;
use App\Models\CombinedServiceItem;
use App\Repositories\Contracts\CombinedServiceRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CombinedServiceService
{
    public function __construct(
        protected CombinedServiceRepositoryInterface $combinedServices
    ) {
    }

    public function listForBusiness(int $businessId, ?int $branchId = null, int $perPage = 15): LengthAwarePaginator
    {
        return $this->combinedServices->paginateForBusiness($businessId, $branchId, $perPage);
    }

    public function createForBusiness(int $businessId, array $data): CombinedService
    {
        return DB::transaction(function () use ($businessId, $data) {
            $itemsData = $data['items'] ?? [];
            unset($data['items']);

            /** @var CombinedService $combined */
            $combined = $this->combinedServices->createForBusiness($businessId, $data);

            $totalDuration = 0;
            foreach ($itemsData as $item) {
                $combined->items()->create([
                    'service_id' => $item['service_id'],
                    'position' => $item['position'] ?? 1,
                    'offset_minutes' => $item['offset_minutes'] ?? 0,
                ]);

                $totalDuration += $item['duration_minutes'] ?? 0;
            }

            if (! $combined->total_duration_minutes) {
                $combined->total_duration_minutes = $totalDuration;
                $combined->save();
            }

            return $combined->load('items');
        });
    }

    public function update(CombinedService $combinedService, array $data): CombinedService
    {
        return DB::transaction(function () use ($combinedService, $data) {
            $itemsData = $data['items'] ?? null;
            unset($data['items']);

            $combinedService->fill($data);
            $combinedService->save();

            if (is_array($itemsData)) {
                $combinedService->items()->delete();

                $totalDuration = 0;
                foreach ($itemsData as $item) {
                    $combinedService->items()->create([
                        'service_id' => $item['service_id'],
                        'position' => $item['position'] ?? 1,
                        'offset_minutes' => $item['offset_minutes'] ?? 0,
                    ]);

                    $totalDuration += $item['duration_minutes'] ?? 0;
                }

                if (! isset($data['total_duration_minutes'])) {
                    $combinedService->total_duration_minutes = $totalDuration;
                    $combinedService->save();
                }
            }

            return $combinedService->load('items');
        });
    }

    public function delete(CombinedService $combinedService): void
    {
        $this->combinedServices->delete($combinedService);
    }
}

