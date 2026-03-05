<?php

namespace App\Repositories\Contracts;

use App\Models\Client;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ClientRepositoryInterface
{
    public function paginateForBusiness(int $businessId, int $perPage = 15): LengthAwarePaginator;

    public function findForBusiness(int $businessId, int $id): ?Client;

    public function createForBusiness(int $businessId, array $data): Client;

    public function update(Client $client, array $data): Client;

    public function delete(Client $client): void;
}

