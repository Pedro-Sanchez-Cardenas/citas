<?php

namespace App\Services;

use App\Models\WorkingHour;
use App\Repositories\Contracts\WorkingHourRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class WorkingHourService
{
    public function __construct(
        protected WorkingHourRepositoryInterface $workingHours
    ) {
    }

    public function listForBusiness(
        int $businessId,
        ?int $branchId = null,
        ?int $professionalId = null,
        int $perPage = 50
    ): LengthAwarePaginator {
        return $this->workingHours->paginateForBusiness($businessId, $branchId, $professionalId, $perPage);
    }

    /**
     * Lista horarios agrupados por sucursal, profesional y conjunto de días,
     * con un solo array de weekdays y un array de bloques horarios comunes.
     *
     * Estructura devuelta:
     * [
     *   {
     *     branch_id: int|null,
     *     branch_name: string,
     *     professional_id: string|null,
     *     professional_name: string,
     *     weekdays: int[], // p.ej. [1,2,3,4,5]
     *     hours: [
     *       {
     *         id: int,
     *         start_time: string,
     *         end_time: string,
     *         effective_from: ?string,
     *         effective_until: ?string,
     *         is_active: bool,
     *       },
     *       …
     *     ],
     *   },
     *   …
     * ]
     */
    public function listGroupedForBusiness(
        int $businessId,
        ?int $branchId = null,
        ?int $professionalId = null
    ): array {
        $query = WorkingHour::query()
            ->with(['branch', 'professional'])
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->when($professionalId, fn ($q) => $q->where('professional_id', $professionalId))
            ->orderBy('weekday')
            ->orderBy('start_time');

        $all = $query->get();

        $groups = $all
            ->groupBy(function (WorkingHour $row) {
                $bid = $row->branch_id ?? 'none';
                $pid = $row->professional_id ?? 'sucursal';

                return $bid . '|' . $pid;
            })
            ->map(function ($rows) {
                /** @var \Illuminate\Support\Collection<int, WorkingHour> $rows */
                /** @var WorkingHour $first */
                $first = $rows->first();

                // Días distintos que comparten este patrón de horario
                $weekdays = $rows->pluck('weekday')->unique()->sort()->values()->map(fn ($w) => (int) $w)->all();

                // Bloques horarios distintos (ignorando el día)
                $hourGroups = $rows->groupBy(function (WorkingHour $row) {
                    return implode('|', [
                        $row->start_time,
                        $row->end_time,
                        optional($row->effective_from)->toDateString(),
                        optional($row->effective_until)->toDateString(),
                        (int) $row->is_active,
                    ]);
                });

                $hours = $hourGroups
                    ->map(function ($byKey) {
                        /** @var \Illuminate\Support\Collection<int, WorkingHour> $byKey */
                        $first = $byKey->first();

                        return [
                            'id' => $first->id,
                            'ids' => $byKey->pluck('id')->values()->all(),
                            'start_time' => $first->start_time,
                            'end_time' => $first->end_time,
                            'effective_from' => optional($first->effective_from)->toDateString(),
                            'effective_until' => optional($first->effective_until)->toDateString(),
                            'is_active' => (bool) $first->is_active,
                        ];
                    })
                    ->sortBy(fn ($hour) => $hour['start_time'])
                    ->values()
                    ->all();

                return [
                    'branch_id' => $first->branch_id,
                    'branch_name' => $first->branch?->name ?? 'Sucursal',
                    'professional_id' => $first->professional_id,
                    'professional_name' => $first->professional?->name ?? 'Horario de sucursal',
                    'weekdays' => $weekdays,
                    'hours' => $hours,
                ];
            })
            ->values()
            ->all();

        return $groups;
    }

    /**
     * Normaliza una hora a formato HH:MM:SS.
     *
     * Acepta:
     * - "HH:MM" → "HH:MM:00"
     * - "HH:MM:SS" → se devuelve igual
     * En cualquier otro caso se devuelve el valor original.
     */
    protected function normalizeTime(?string $time): ?string
    {
        if ($time === null || $time === '') {
            return $time;
        }

        // Ya viene con segundos.
        if (preg_match('/^\d{2}:\d{2}:\d{2}$/', $time)) {
            return $time;
        }

        // Formato HH:MM → añadimos ":00".
        if (preg_match('/^\d{2}:\d{2}$/', $time)) {
            return $time . ':00';
        }

        return $time;
    }

    public function createForBusiness(int $businessId, array $data): WorkingHour
    {
        $weekdays = $data['weekday'] ?? [];
        $hours = $data['hours'] ?? [];

        unset($data['weekday'], $data['hours']);

        return DB::transaction(function () use ($businessId, $data, $weekdays, $hours): WorkingHour {
            $first = null;

            foreach ($weekdays as $weekday) {
                foreach ($hours as $block) {
                    $rowData = array_merge($data, [
                        'weekday' => $weekday,
                        'start_time' => $this->normalizeTime($block['start_time'] ?? null),
                        'end_time' => $this->normalizeTime($block['end_time'] ?? null),
                    ]);

                    $created = $this->workingHours->createForBusiness($businessId, $rowData);

                    if ($first === null) {
                        $first = $created;
                    }
                }
            }

            return $first;
        });
    }

    public function update(WorkingHour $workingHour, array $data): WorkingHour
    {
        $weekdays = $data['weekday'] ?? [$workingHour->weekday];
        $hours = $data['hours'] ?? null;

        unset($data['weekday'], $data['hours']);

        return DB::transaction(function () use ($workingHour, $data, $weekdays, $hours): WorkingHour {
            // Eliminamos todos los registros existentes para la combinación actual
            WorkingHour::query()
                ->where('business_id', $workingHour->business_id)
                ->where('branch_id', $workingHour->branch_id)
                ->where('professional_id', $workingHour->professional_id)
                ->whereIn('weekday', $weekdays)
                ->delete();

            $first = null;
            $hoursList = $hours ?: [[
                'start_time' => $workingHour->start_time,
                'end_time' => $workingHour->end_time,
            ]];

            foreach ($weekdays as $weekday) {
                foreach ($hoursList as $block) {
                    $rowData = array_merge($data, [
                        'business_id' => $workingHour->business_id,
                        'branch_id' => $workingHour->branch_id,
                        'professional_id' => $workingHour->professional_id,
                        'weekday' => $weekday,
                        'start_time' => $this->normalizeTime($block['start_time'] ?? null),
                        'end_time' => $this->normalizeTime($block['end_time'] ?? null),
                    ]);

                    $created = WorkingHour::create($rowData);

                    if ($first === null) {
                        $first = $created;
                    }
                }
            }

            return $first ?? $workingHour;
        });
    }

    public function delete(WorkingHour $workingHour): void
    {
        $this->workingHours->delete($workingHour);
    }
}

