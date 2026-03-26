<?php

namespace App\Repositories;

use App\Models\Appointment;
use App\Repositories\Contracts\AppointmentRepositoryInterface;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EloquentAppointmentRepository implements AppointmentRepositoryInterface
{
    public function findById(int $id): ?Appointment
    {
        return Appointment::find($id);
    }

    public function findForBusiness(int $businessId, int $id): ?Appointment
    {
        return Appointment::query()
            ->where('business_id', $businessId)
            ->whereKey($id)
            ->first();
    }

    public function listForClientInBusiness(int $businessId, int $clientId): Collection
    {
        return Appointment::query()
            ->where('business_id', $businessId)
            ->where('client_id', $clientId)
            ->with(['branch:id,name', 'professional:id,name', 'service:id,name', 'combinedService:id,name'])
            ->orderByDesc('start_at')
            ->get();
    }

    public function getBetween(
        int $businessId,
        CarbonImmutable $start,
        CarbonImmutable $end,
        ?int $branchId = null,
        ?int $professionalId = null
    ): Collection {
        return Appointment::query()
            ->with(['client', 'professional', 'service'])
            ->where('business_id', $businessId)
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

    public function paginateForIndex(
        int $businessId,
        ?int $branchId,
        ?int $professionalId,
        int $perPage
    ): LengthAwarePaginator {
        return Appointment::query()
            ->where('business_id', $businessId)
            ->with(['branch', 'professional', 'service', 'combinedService', 'client'])
            ->when($branchId !== null, fn ($q) => $q->where('branch_id', $branchId))
            ->when($professionalId !== null, fn ($q) => $q->where('professional_id', $professionalId))
            ->orderBy('start_at')
            ->paginate($perPage);
    }

    public function delete(Appointment $appointment): void
    {
        $appointment->delete();
    }

    public function loadStandardRelations(Appointment $appointment): Appointment
    {
        return $appointment->load(['branch', 'professional', 'service', 'combinedService', 'client']);
    }

    public function loadPublicBookingRelations(Appointment $appointment): Appointment
    {
        return $appointment->load(['branch', 'professional', 'service']);
    }
}

