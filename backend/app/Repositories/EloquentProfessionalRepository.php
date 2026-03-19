<?php

namespace App\Repositories;

use App\Models\User;
use App\Models\Professional;
use App\Repositories\Contracts\ProfessionalRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class EloquentProfessionalRepository implements ProfessionalRepositoryInterface
{
    public function paginateForBusiness(int $businessId, ?int $branchId = null, int $perPage = 15): LengthAwarePaginator
    {
        return Professional::query()
            ->where('business_id', $businessId)
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->orderBy('name')
            ->paginate($perPage);
    }

    public function findForBusiness(int $businessId, int $id): ?Professional
    {
        return Professional::query()
            ->where('business_id', $businessId)
            ->find($id);
    }

    public function createForBusiness(int $businessId, array $data): Professional
    {
        $createWorkerUser = (bool) ($data['create_worker_user'] ?? false);
        $workerPassword = $data['worker_password'] ?? null;

        unset($data['create_worker_user'], $data['worker_password']);

        $data['business_id'] = $businessId;

        $professional = Professional::create($data);

        if ($createWorkerUser) {
            // El correo del professional se usa como login del worker.
            if (empty($professional->email) || empty($workerPassword)) {
                // No debería pasar si la validación del request es correcta.
                return $professional;
            }

            $user = User::create([
                'name' => $professional->name,
                'email' => $professional->email,
                'password' => Hash::make((string) $workerPassword),
                'business_id' => $businessId,
                'professional_id' => $professional->id,
            ]);

            $user->assignRole('worker');
        }

        return $professional;
    }

    public function update(Professional $professional, array $data): Professional
    {
        $updateWorkerPassword = (bool) ($data['update_worker_password'] ?? false);
        $workerPassword = $data['worker_password'] ?? null;
        unset($data['update_worker_password'], $data['worker_password']);

        $professional->fill($data);
        $professional->save();

        // Mantener el usuario ligado actualizado cuando el email/nombre cambia.
        $user = $professional->user;
        if ($user) {
            if (array_key_exists('name', $data)) {
                $user->name = $data['name'];
            }

            if (array_key_exists('email', $data) && $data['email'] !== null) {
                $user->email = $data['email'];
            }

            if ($updateWorkerPassword && ! empty($workerPassword)) {
                $user->password = Hash::make((string) $workerPassword);
            }

            $user->save();
        }

        return $professional;
    }

    public function delete(Professional $professional): void
    {
        $professional->user?->delete();
        $professional->delete();
    }
}

