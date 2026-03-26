<?php

namespace App\Repositories\Contracts;

use App\Models\Branch;
use Illuminate\Support\Collection;

interface BranchRepositoryInterface
{
    /**
     * Lista sucursales del negocio (ordenadas por nombre).
     *
     * @return Collection<int, Branch>
     */
    public function listForBusiness(int $businessId): Collection;

    /**
     * Sucursales con relación services (solo activos) para reserva pública.
     *
     * @return Collection<int, Branch>
     */
    public function getBranchesWithActiveServices(int $businessId): Collection;

    public function existsForBusiness(int $branchId, int $businessId): bool;
}

