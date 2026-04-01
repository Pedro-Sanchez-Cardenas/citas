<?php

namespace App\Repositories\Contracts;

use App\Models\Professional;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface ProfessionalRepositoryInterface
{
    public function paginateForBusiness(int $businessId, ?int $branchId = null, int $perPage = 15): LengthAwarePaginator;

    public function findForBusiness(int $businessId, int $id): ?Professional;

    /**
     * Filtra cuáles ids de profesionales pertenecen al negocio.
     *
     * @param  int[]  $ids
     * @return int[] ids válidos (únicos)
     */
    public function filterIdsForBusiness(int $businessId, array $ids): array;

    /**
     * @param  array<string, mixed>  $data  Incluye create_worker_user / worker_password cuando aplique.
     *                                      El correo solo es obligatorio si create_worker_user es true.
     */
    public function createForBusiness(int $businessId, array $data): Professional;

    public function update(Professional $professional, array $data): Professional;

    public function delete(Professional $professional): void;

    /**
     * Sucursal del profesional dentro del negocio, o null si no existe / no pertenece al negocio.
     */
    public function getBranchIdForProfessionalInBusiness(int $businessId, int $professionalId): ?int;

    /**
     * Profesionales activos para API pública (id, name, branch_id).
     *
     * @return Collection<int, Professional>
     */
    public function listActiveForPublicBooking(int $businessId): Collection;
}
