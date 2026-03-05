<?php

namespace App\Services;

use App\Models\Branch;
use App\Models\Product;
use App\Models\Professional;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use App\Models\WorkingHour;

class BusinessSetupService
{
    /**
     * Devuelve el estado de onboarding/configuración inicial del negocio del usuario.
     *
     * @return array{
     *     message: string,
     *     completed: bool,
     *     steps: array<int, array{
     *         key: string,
     *         label: string,
     *         completed: bool,
     *         count: int
     *     }>
     * }
     */
    public function getSetupStatus(?User $user): array
    {
        $businessId = $user?->business_id ? (int) $user->business_id : null;

        if ($businessId === null) {
            return [
                'message' => 'El usuario aún no tiene un negocio asociado.',
                'completed' => false,
                'steps' => [],
            ];
        }

        $branchesCount = Branch::query()
            ->where('business_id', $businessId)
            ->count();

        $serviceCategoriesCount = ServiceCategory::query()
            ->where('business_id', $businessId)
            ->count();

        $servicesCount = Service::query()
            ->where('business_id', $businessId)
            ->count();

        $professionalsCount = Professional::query()
            ->where('business_id', $businessId)
            ->count();

        $workingHoursCount = WorkingHour::query()
            ->where('business_id', $businessId)
            ->count();

        $productsCount = Product::query()
            ->where('business_id', $businessId)
            ->count();

        $steps = [
            [
                'key' => 'branches',
                'label' => 'Sucursal principal configurada',
                'completed' => $branchesCount > 0,
                'count' => $branchesCount,
            ],
            [
                'key' => 'service_categories',
                'label' => 'Categorías de servicio creadas',
                'completed' => $serviceCategoriesCount > 0,
                'count' => $serviceCategoriesCount,
            ],
            [
                'key' => 'services',
                'label' => 'Servicios configurados',
                'completed' => $servicesCount > 0,
                'count' => $servicesCount,
            ],
            [
                'key' => 'professionals',
                'label' => 'Profesionales dados de alta',
                'completed' => $professionalsCount > 0,
                'count' => $professionalsCount,
            ],
            [
                'key' => 'working_hours',
                'label' => 'Horarios de trabajo configurados',
                'completed' => $workingHoursCount > 0,
                'count' => $workingHoursCount,
            ],
            [
                'key' => 'products',
                'label' => 'Productos dados de alta',
                'completed' => $productsCount > 0,
                'count' => $productsCount,
            ],
        ];

        $completed = collect($steps)->every(fn (array $step) => $step['completed'] === true);

        return [
            'message' => 'Estado de configuración del negocio',
            'completed' => $completed,
            'steps' => $steps,
        ];
    }
}

