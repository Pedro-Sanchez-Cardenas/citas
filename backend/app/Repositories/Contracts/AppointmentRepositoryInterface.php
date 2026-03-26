<?php

namespace App\Repositories\Contracts;

use App\Models\Appointment;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface AppointmentRepositoryInterface
{
    public function findById(int $id): ?Appointment;

    public function findForBusiness(int $businessId, int $id): ?Appointment;

    /**
     * Citas del cliente en el negocio (portal público).
     */
    public function listForClientInBusiness(int $businessId, int $clientId): Collection;

    /**
     * Citas en un rango de fechas opcionalmente filtradas por sucursal/profesional.
     */
    public function getBetween(
        int $businessId,
        CarbonImmutable $start,
        CarbonImmutable $end,
        ?int $branchId = null,
        ?int $professionalId = null
    ): Collection;

    public function create(array $data): Appointment;

    public function update(Appointment $appointment, array $data): Appointment;

    /**
     * Listado paginado para panel (filtros opcionales por sucursal y profesional).
     */
    public function paginateForIndex(
        int $businessId,
        ?int $branchId,
        ?int $professionalId,
        int $perPage
    ): LengthAwarePaginator;

    public function delete(Appointment $appointment): void;

    public function loadStandardRelations(Appointment $appointment): Appointment;

    public function loadPublicBookingRelations(Appointment $appointment): Appointment;
}

