<?php

namespace App\Repositories;

use App\Models\Client;
use App\Models\ClientMedia;
use App\Repositories\Contracts\ClientMediaRepositoryInterface;
use Illuminate\Support\Collection;

class EloquentClientMediaRepository implements ClientMediaRepositoryInterface
{
    public function listForClient(Client $client): Collection
    {
        return ClientMedia::query()
            ->where('client_id', $client->id)
            ->orderByDesc('created_at')
            ->get();
    }

    public function create(array $data): ClientMedia
    {
        return ClientMedia::create($data);
    }

    public function delete(ClientMedia $media): void
    {
        $media->delete();
    }

    public function loadClient(ClientMedia $media): ClientMedia
    {
        return $media->load('client');
    }
}
