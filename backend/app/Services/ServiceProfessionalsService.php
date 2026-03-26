<?php

namespace App\Services;

use App\Models\Service;
use Illuminate\Support\Collection;

class ServiceProfessionalsService
{
    public function __construct(
        protected ProfessionalService $professionals
    ) {
    }

    /**
     * Lista profesionales asignados a un servicio.
     */
    public function listForService(Service $service): Collection
    {
        return $service->professionals()->get();
    }

    /**
     * Sincroniza profesionales (solo ids del mismo negocio).
     *
     * @return Collection
     */
    public function syncForService(Service $service, int $businessId, array $professionalIds): Collection
    {
        $validIds = $this->professionals->filterIdsForBusiness($businessId, $professionalIds);

        $service->professionals()->sync($validIds);

        return $service->professionals()->get();
    }
}

