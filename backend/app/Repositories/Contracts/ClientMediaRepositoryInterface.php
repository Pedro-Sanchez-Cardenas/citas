<?php

namespace App\Repositories\Contracts;

use App\Models\Client;
use App\Models\ClientMedia;
use Illuminate\Support\Collection;

interface ClientMediaRepositoryInterface
{
    public function listForClient(Client $client): Collection;

    public function create(array $data): ClientMedia;

    public function delete(ClientMedia $media): void;

    public function loadClient(ClientMedia $media): ClientMedia;
}
