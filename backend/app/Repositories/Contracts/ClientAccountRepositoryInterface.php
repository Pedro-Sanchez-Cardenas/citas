<?php

namespace App\Repositories\Contracts;

use App\Models\ClientAccount;

interface ClientAccountRepositoryInterface
{
    public function findByBusinessAndEmail(int $businessId, string $email): ?ClientAccount;

    public function create(array $data): ClientAccount;

    public function update(ClientAccount $account, array $data): ClientAccount;

    public function updateLastLoginAt(ClientAccount $account): void;
}
