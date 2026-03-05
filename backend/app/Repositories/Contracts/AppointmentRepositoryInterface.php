<?php

namespace App\Repositories\Contracts;

use App\Models\Appointment;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

interface AppointmentRepositoryInterface
{
    public function findById(int $id): ?Appointment;

    /**
     * Citas en un rango de fechas opcionalmente filtradas por sucursal/profesional.
     */
    public function getBetween(
        CarbonImmutable $start,
        CarbonImmutable $end,
        ?int $branchId = null,
        ?int $professionalId = null
    ): Collection;

    public function create(array $data): Appointment;

    public function update(Appointment $appointment, array $data): Appointment;
}

