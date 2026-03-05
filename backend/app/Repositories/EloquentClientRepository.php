<?php

namespace App\Repositories;

use App\Models\Client;
use App\Repositories\Contracts\ClientRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class EloquentClientRepository implements ClientRepositoryInterface
{
    public function paginateForBusiness(int $businessId, int $perPage = 15): LengthAwarePaginator
    {
        return Client::query()
            ->where('business_id', $businessId)
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function findForBusiness(int $businessId, int $id): ?Client
    {
        return Client::query()
            ->where('business_id', $businessId)
            ->find($id);
    }

    public function createForBusiness(int $businessId, array $data): Client
    {
        $data['business_id'] = $businessId;

        return Client::create($data);
    }

    public function update(Client $client, array $data): Client
    {
        $client->fill($data);
        $client->save();

        return $client;
    }

    public function delete(Client $client): void
    {
        $client->delete();
    }
}

