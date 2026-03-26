<?php

namespace App\Repositories;

use App\Models\Client;
use App\Repositories\Contracts\ClientRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class EloquentClientRepository implements ClientRepositoryInterface
{
    public function paginateForBusiness(int $businessId, int $perPage = 15): LengthAwarePaginator
    {
        return Client::query()
            ->where('business_id', $businessId)
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function paginateForBusinessScopedToBranch(int $businessId, int $branchId, int $perPage = 15): LengthAwarePaginator
    {
        return Client::query()
            ->where('business_id', $businessId)
            ->where(function ($q) use ($branchId) {
                $q->where('branch_id', $branchId)->orWhereNull('branch_id');
            })
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function findForBusiness(int $businessId, int $id): ?Client
    {
        return Client::query()
            ->where('business_id', $businessId)
            ->find($id);
    }

    public function findByBusinessAndEmail(int $businessId, string $email): ?Client
    {
        return Client::query()
            ->where('business_id', $businessId)
            ->where('email', $email)
            ->first();
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

    public function getAppointmentsHistoryForClient(Client $client): Collection
    {
        return $client->appointments()
            ->with(['branch', 'professional', 'service', 'combinedService', 'payments'])
            ->orderByDesc('start_at')
            ->get();
    }

    public function getMediaOrderedForClient(Client $client): Collection
    {
        return $client->media()
            ->orderByDesc('created_at')
            ->get();
    }
}

