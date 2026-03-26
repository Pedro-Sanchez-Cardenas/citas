<?php

namespace App\Services;

use App\Models\Client;
use App\Models\ClientMedia;
use App\Repositories\Contracts\ClientMediaRepositoryInterface;
use Illuminate\Support\Collection;

class ClientMediaService
{
    public function __construct(
        protected ClientMediaRepositoryInterface $clientMedia
    ) {
    }

    public function listForClient(Client $client): Collection
    {
        return $this->clientMedia->listForClient($client);
    }

    public function createForClient(Client $client, array $data): ClientMedia
    {
        $data['client_id'] = $client->id;

        return $this->clientMedia->create($data);
    }

    public function loadClientForAuthorization(ClientMedia $media): ClientMedia
    {
        return $this->clientMedia->loadClient($media);
    }

    public function delete(ClientMedia $media): void
    {
        $this->clientMedia->delete($media);
    }
}
