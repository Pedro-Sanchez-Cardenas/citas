<?php

namespace App\Services;

use App\Models\Professional;
use App\Repositories\Contracts\ProfessionalRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ProfessionalService
{
    public function __construct(
        protected ProfessionalRepositoryInterface $professionals
    ) {}

    public function listForBusiness(int $businessId, ?int $branchId = null, int $perPage = 15): LengthAwarePaginator
    {
        return $this->professionals->paginateForBusiness($businessId, $branchId, $perPage);
    }

    public function filterIdsForBusiness(int $businessId, array $ids): array
    {
        return $this->professionals->filterIdsForBusiness($businessId, $ids);
    }

    /**
     * @param  array<string, mixed>  $data  Debe incluir create_worker_user / worker_password cuando aplique.
     *                                      El correo solo es obligatorio si create_worker_user es true (validación en StoreProfessionalRequest).
     */
    public function createForBusiness(int $businessId, array $data): Professional
    {
        return $this->professionals->createForBusiness($businessId, $data);
    }

    public function createWithOptionalPhoto(int $businessId, array $data, ?UploadedFile $photo): Professional
    {
        $professional = $this->professionals->createForBusiness($businessId, $data);

        if ($photo) {
            $path = $photo->store(
                sprintf('professionals/%s/%s', $businessId, $professional->id),
                'public'
            );
            $professional = $this->professionals->update($professional, ['photo_path' => $path]);
        }

        return $professional;
    }

    public function update(Professional $professional, array $data): Professional
    {
        return $this->professionals->update($professional, $data);
    }

    public function updateWithOptionalPhoto(Professional $professional, int $businessId, array $data, ?UploadedFile $photo): Professional
    {
        if ($photo) {
            $dir = sprintf('professionals/%s/%s', $businessId, $professional->id);
            if ($professional->photo_path) {
                Storage::disk('public')->delete($professional->photo_path);
            }
            $path = $photo->store($dir, 'public');
            $data['photo_path'] = $path;
        }

        return $this->professionals->update($professional, $data);
    }

    public function delete(Professional $professional): void
    {
        $this->professionals->delete($professional);
    }

    public function findForBusiness(int $businessId, int $id): ?Professional
    {
        return $this->professionals->findForBusiness($businessId, $id);
    }

    /**
     * @return array{0: int, 1: int} [workerProfessionalId, workerBranchId]
     */
    public function requireWorkerBranchContext(int $businessId, ?int $workerProfessionalId): array
    {
        $workerProfessionalId = (int) ($workerProfessionalId ?? 0);
        if ($workerProfessionalId <= 0) {
            abort(403, 'Usuario worker sin profesional asignado.');
        }

        $workerBranchId = (int) ($this->professionals->getBranchIdForProfessionalInBusiness($businessId, $workerProfessionalId) ?? 0);
        if ($workerBranchId <= 0) {
            abort(403, 'Usuario worker sin sucursal asignada.');
        }

        return [$workerProfessionalId, $workerBranchId];
    }
}
