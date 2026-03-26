<?php

namespace App\Repositories;

use App\Models\ClientAccount;
use App\Repositories\Contracts\ClientAccountRepositoryInterface;

class EloquentClientAccountRepository implements ClientAccountRepositoryInterface
{
    public function findByBusinessAndEmail(int $businessId, string $email): ?ClientAccount
    {
        return ClientAccount::query()
            ->where('business_id', $businessId)
            ->where('email', $email)
            ->first();
    }

    public function create(array $data): ClientAccount
    {
        return ClientAccount::create($data);
    }

    public function update(ClientAccount $account, array $data): ClientAccount
    {
        $account->fill($data);
        $account->save();

        return $account;
    }

    public function updateLastLoginAt(ClientAccount $account): void
    {
        $account->forceFill(['last_login_at' => now()])->save();
    }
}
