<?php

namespace App\Services;

use App\Models\Client;
use App\Repositories\Contracts\ClientRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ClientService
{
    public function __construct(
        protected ClientRepositoryInterface $clients
    ) {
    }

    public function listForBusiness(int $businessId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->clients->paginateForBusiness($businessId, $perPage);
    }

    public function createForBusiness(int $businessId, array $data): Client
    {
        return $this->clients->createForBusiness($businessId, $data);
    }

    public function update(Client $client, array $data): Client
    {
        return $this->clients->update($client, $data);
    }

    public function delete(Client $client): void
    {
        $this->clients->delete($client);
    }
}

