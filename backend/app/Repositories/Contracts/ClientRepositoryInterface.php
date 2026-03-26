<?php

namespace App\Repositories\Contracts;

use App\Models\Client;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface ClientRepositoryInterface
{
    public function paginateForBusiness(int $businessId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Clientes del negocio visibles en una sucursal: misma sucursal o sin sucursal asignada.
     */
    public function paginateForBusinessScopedToBranch(int $businessId, int $branchId, int $perPage = 15): LengthAwarePaginator;

    public function findForBusiness(int $businessId, int $id): ?Client;

    public function findByBusinessAndEmail(int $businessId, string $email): ?Client;

    public function createForBusiness(int $businessId, array $data): Client;

    public function update(Client $client, array $data): Client;

    public function delete(Client $client): void;

    public function getAppointmentsHistoryForClient(Client $client): Collection;

    public function getMediaOrderedForClient(Client $client): Collection;
}

