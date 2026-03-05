<?php

namespace App\Repositories;

use App\Models\Appointment;
use App\Repositories\Contracts\AppointmentRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class EloquentAppointmentRepository implements AppointmentRepositoryInterface
{
    public function findById(int $id): ?Appointment
    {
        return Appointment::find($id);
    }

    public function getBetween(
        CarbonImmutable $start,
        CarbonImmutable $end,
        ?int $branchId = null,
        ?int $professionalId = null
    ): Collection {
        return Appointment::query()
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->when($professionalId, fn ($q) => $q->where('professional_id', $professionalId))
            ->where(function ($q) use ($start, $end) {
                // Overlap entre [start_at, end_at] y el rango solicitado
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

    public function create(array $data): Appointment
    {
        return Appointment::create($data);
    }

    public function update(Appointment $appointment, array $data): Appointment
    {
        $appointment->fill($data);
        $appointment->save();

        return $appointment;
    }
}

