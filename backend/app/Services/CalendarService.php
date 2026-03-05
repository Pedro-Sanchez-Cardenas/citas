<?php

namespace App\Services;

use App\Models\TimeBlock;
use App\Models\WorkingHour;
use App\Repositories\Contracts\AppointmentRepositoryInterface;
use Carbon\CarbonImmutable;

class CalendarService
{
    public function __construct(
        protected AppointmentRepositoryInterface $appointmentRepository
    ) {
    }

    /**
     * Vista por día para el calendario.
     */
    public function getDayView(
        CarbonImmutable $date,
        ?int $branchId = null,
        ?int $professionalId = null
    ): array {
        $start = $date->startOfDay();
        $end = $date->endOfDay();

        $appointments = $this->appointmentRepository
            ->getBetween($start, $end, $branchId, $professionalId);

        $workingHours = $this->getWorkingHoursForRange($start, $end, $branchId, $professionalId);
        $blocks = $this->getBlocksForRange($start, $end, $branchId, $professionalId);

        return [
            'range' => [
                'start' => $start->toIso8601String(),
                'end' => $end->toIso8601String(),
            ],
            'appointments' => $appointments,
            'working_hours' => $workingHours,
            'blocks' => $blocks,
        ];
    }

    /**
     * Vista por semana (7 días a partir de la fecha indicada).
     */
    public function getWeekView(
        CarbonImmutable $startOfWeek,
        ?int $branchId = null,
        ?int $professionalId = null
    ): array {
        $start = $startOfWeek->startOfDay();
        $end = $start->addDays(6)->endOfDay();

        $appointments = $this->appointmentRepository
            ->getBetween($start, $end, $branchId, $professionalId);

        $workingHours = $this->getWorkingHoursForRange($start, $end, $branchId, $professionalId);
        $blocks = $this->getBlocksForRange($start, $end, $branchId, $professionalId);

        return [
            'range' => [
                'start' => $start->toIso8601String(),
                'end' => $end->toIso8601String(),
            ],
            'appointments' => $appointments,
            'working_hours' => $workingHours,
            'blocks' => $blocks,
        ];
    }

    protected function getWorkingHoursForRange(
        CarbonImmutable $start,
        CarbonImmutable $end,
        ?int $branchId,
        ?int $professionalId
    ) {
        // Horarios dinámicos por día de la semana y fecha efectiva
        return WorkingHour::query()
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->when($professionalId, fn ($q) => $q->where('professional_id', $professionalId))
            ->where('is_active', true)
            ->where(function ($q) use ($start, $end) {
                $q->whereNull('effective_from')
                    ->orWhere('effective_from', '<=', $end->toDateString());
            })
            ->where(function ($q) use ($start) {
                $q->whereNull('effective_until')
                    ->orWhere('effective_until', '>=', $start->toDateString());
            })
            ->orderBy('weekday')
            ->get();
    }

    protected function getBlocksForRange(
        CarbonImmutable $start,
        CarbonImmutable $end,
        ?int $branchId,
        ?int $professionalId
    ) {
        return TimeBlock::query()
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->when($professionalId, fn ($q) => $q->where('professional_id', $professionalId))
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_at', [$start, $end])
                    ->orWhereBetween('end_at', [$start, $end])
                    ->orWhere(function ($q2) use ($start, $end) {
                        $q2->where('start_at', '<=', $start)
                            ->where('end_at', '>=', $end);
                    });
            })
            ->orderBy('start_at')
            ->get();
    }
}

