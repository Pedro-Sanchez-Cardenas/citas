<?php

namespace App\Services;

use App\Models\Client;
use App\Repositories\Contracts\ClientRepositoryInterface;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ClientService
{
    public function __construct(
        protected ClientRepositoryInterface $clients,
        protected ProfessionalService $professionalService
    ) {
    }

    public function listForBusiness(int $businessId, int $perPage = 15): LengthAwarePaginator
    {
        return $this->clients->paginateForBusiness($businessId, $perPage);
    }

    public function paginateForAuthenticatedUser(Authenticatable $user, int $businessId): LengthAwarePaginator
    {
        if ($user->hasRole('worker')) {
            [, $workerBranchId] = $this->professionalService->requireWorkerBranchContext(
                $businessId,
                $user->professional_id ?? null
            );

            return $this->clients->paginateForBusinessScopedToBranch($businessId, $workerBranchId, 15);
        }

        return $this->clients->paginateForBusiness($businessId, 15);
    }

    public function createForBusiness(int $businessId, array $data): Client
    {
        return $this->clients->createForBusiness($businessId, $data);
    }

    public function createWithOptionalPhoto(int $businessId, array $data, ?UploadedFile $photo): Client
    {
        $client = $this->clients->createForBusiness($businessId, $data);

        if ($photo) {
            $path = $photo->store(
                sprintf('clients/%s/%s', $businessId, $client->id),
                'public'
            );
            $client = $this->clients->update($client, ['photo_path' => $path]);
        }

        return $client;
    }

    public function update(Client $client, array $data): Client
    {
        return $this->clients->update($client, $data);
    }

    public function updateWithOptionalPhoto(Client $client, int $businessId, array $data, ?UploadedFile $photo): Client
    {
        if ($photo) {
            $dir = sprintf('clients/%s/%s', $businessId, $client->id);
            if ($client->photo_path) {
                Storage::disk('public')->delete($client->photo_path);
            }
            $path = $photo->store($dir, 'public');
            $data['photo_path'] = $path;
        }

        return $this->clients->update($client, $data);
    }

    public function delete(Client $client): void
    {
        $this->clients->delete($client);
    }

    public function historyPayload(Client $client): array
    {
        return [
            'appointments' => $this->clients->getAppointmentsHistoryForClient($client),
            'media' => $this->clients->getMediaOrderedForClient($client),
        ];
    }
}

