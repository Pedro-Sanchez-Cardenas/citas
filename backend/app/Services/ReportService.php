<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Payment;
use App\Models\Professional;
use App\Models\Service;
use App\Models\WorkingHour;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ReportService
{
    public function businessSummary(int $businessId, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $appointmentsQuery = Appointment::query()
            ->where('business_id', $businessId)
            ->whereBetween('start_at', [$from, $to]);

        $totalAppointments = $appointmentsQuery->count();

        $cancelled = (clone $appointmentsQuery)->where('status', 'cancelled')->count();
        $noShow = (clone $appointmentsQuery)->where('status', 'no_show')->count();
        $attended = (clone $appointmentsQuery)->where('status', 'attended')->count();

        $revenueCents = Payment::query()
            ->where('business_id', $businessId)
            ->where('status', 'paid')
            ->whereBetween('created_at', [$from, $to])
            ->sum('amount_cents');

        $avgTicket = $attended > 0 ? ($revenueCents / max($attended, 1)) / 100 : 0.0;

        $topServices = Appointment::query()
            ->select('service_id', DB::raw('count(*) as total'))
            ->where('business_id', $businessId)
            ->whereBetween('start_at', [$from, $to])
            ->whereNotNull('service_id')
            ->groupBy('service_id')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(function ($row) {
                $service = Service::find($row->service_id);

                return [
                    'service_id' => $row->service_id,
                    'name' => $service?->name,
                    'total' => (int) $row->total,
                ];
            });

        return [
            'range' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'appointments' => [
                'total' => $totalAppointments,
                'cancelled' => $cancelled,
                'no_show' => $noShow,
                'attended' => $attended,
            ],
            'revenue' => [
                'total' => $revenueCents / 100,
                'currency' => 'USD',
                'avg_ticket' => $avgTicket,
            ],
            'top_services' => $topServices,
        ];
    }

    public function professionalPerformance(
        int $businessId,
        CarbonImmutable $from,
        CarbonImmutable $to,
        ?int $branchId = null
    ): Collection {
        $appointmentsQuery = Appointment::query()
            ->where('business_id', $businessId)
            ->whereBetween('start_at', [$from, $to])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId));

        $appointments = $appointmentsQuery->get()
            ->groupBy('professional_id');

        $payments = Payment::query()
            ->where('business_id', $businessId)
            ->where('status', 'paid')
            ->whereBetween('created_at', [$from, $to])
            ->get()
            ->groupBy(function (Payment $p) {
                return optional($p->appointment)->professional_id;
            });

        $workingHours = WorkingHour::query()
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->get()
            ->groupBy('professional_id');

        $days = $this->datePeriod($from, $to);

        return $appointments->map(function (Collection $appts, $professionalId) use ($payments, $workingHours, $days) {
            $professional = Professional::find($professionalId);

            $totalAppointments = $appts->count();
            $attended = $appts->where('status', 'attended')->count();
            $cancelled = $appts->where('status', 'cancelled')->count();

            $bookedMinutes = $appts->sum(function (Appointment $a) {
                return $a->end_at->diffInMinutes($a->start_at);
            });

            $revenueCents = ($payments->get($professionalId) ?? collect())
                ->sum('amount_cents');

            $workingMinutes = $this->workingMinutesForProfessional(
                $workingHours->get($professionalId) ?? collect(),
                $days,
            );

            $occupancy = $workingMinutes > 0
                ? $bookedMinutes / $workingMinutes
                : null;

            return [
                'professional_id' => $professionalId,
                'name' => $professional?->name,
                'appointments' => [
                    'total' => $totalAppointments,
                    'attended' => $attended,
                    'cancelled' => $cancelled,
                ],
                'booked_minutes' => $bookedMinutes,
                'working_minutes' => $workingMinutes,
                'occupancy' => $occupancy,
                'revenue' => $revenueCents / 100,
            ];
        })->values();
    }

    public function servicePerformance(
        int $businessId,
        CarbonImmutable $from,
        CarbonImmutable $to,
        ?int $branchId = null
    ): Collection {
        return Appointment::query()
            ->select('service_id', DB::raw('count(*) as total_appointments'))
            ->where('business_id', $businessId)
            ->whereBetween('start_at', [$from, $to])
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->whereNotNull('service_id')
            ->groupBy('service_id')
            ->orderByDesc('total_appointments')
            ->get()
            ->map(function ($row) use ($businessId, $from, $to, $branchId) {
                $service = Service::find($row->service_id);

                $revenueCents = Payment::query()
                    ->where('business_id', $businessId)
                    ->where('status', 'paid')
                    ->whereBetween('created_at', [$from, $to])
                    ->whereHas('appointment', function ($q) use ($row, $branchId) {
                        $q->where('service_id', $row->service_id)
                            ->when($branchId, fn ($q2) => $q2->where('branch_id', $branchId));
                    })
                    ->sum('amount_cents');

                return [
                    'service_id' => $row->service_id,
                    'name' => $service?->name,
                    'total_appointments' => (int) $row->total_appointments,
                    'revenue' => $revenueCents / 100,
                ];
            });
    }

    /**
     * @return array<int, CarbonImmutable>
     */
    protected function datePeriod(CarbonImmutable $from, CarbonImmutable $to): array
    {
        $days = [];
        $current = $from->startOfDay();
        $end = $to->endOfDay();

        while ($current <= $end) {
            $days[] = $current;
            $current = $current->addDay();
        }

        return $days;
    }

    /**
     * @param Collection<int, WorkingHour> $hours
     */
    protected function workingMinutesForProfessional(Collection $hours, array $days): int
    {
        if ($hours->isEmpty()) {
            return 0;
        }

        $byWeekday = $hours->groupBy('weekday');
        $minutes = 0;

        foreach ($days as $day) {
            $weekday = $day->dayOfWeekIso % 7;
            $dayHours = $byWeekday->get($weekday, collect());

            foreach ($dayHours as $h) {
                $start = CarbonImmutable::parse($day->toDateString() . ' ' . $h->start_time);
                $end = CarbonImmutable::parse($day->toDateString() . ' ' . $h->end_time);
                $minutes += $end->diffInMinutes($start);
            }
        }

        return $minutes;
    }
}

