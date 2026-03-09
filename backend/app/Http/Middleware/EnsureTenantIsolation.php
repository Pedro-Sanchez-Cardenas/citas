<?php

namespace App\Http\Middleware;

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Client;
use App\Models\CombinedService;
use App\Models\Professional;
use App\Models\Product;
use App\Models\Service;
use App\Models\ServiceCategory;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantIsolation
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $businessId = (int) ($user?->business_id ?? 0);

        if ($businessId <= 0) {
            abort(403, 'Usuario sin negocio asignado.');
        }

        $payload = $request->all();

        $this->assertBusinessOwnership(
            $payload,
            $businessId,
            ['branch_id', 'default_branch_id'],
            fn (int $id): bool => Branch::query()
                ->whereKey($id)
                ->where('business_id', $businessId)
                ->exists()
        );

        $this->assertBusinessOwnership(
            $payload,
            $businessId,
            ['professional_id', 'professional_ids.*'],
            fn (int $id): bool => Professional::query()
                ->whereKey($id)
                ->where('business_id', $businessId)
                ->exists()
        );

        $this->assertBusinessOwnership(
            $payload,
            $businessId,
            ['service_id', 'items.*.service_id'],
            fn (int $id): bool => Service::query()
                ->whereKey($id)
                ->where('business_id', $businessId)
                ->exists()
        );

        $this->assertBusinessOwnership(
            $payload,
            $businessId,
            ['combined_service_id'],
            fn (int $id): bool => CombinedService::query()
                ->whereKey($id)
                ->where('business_id', $businessId)
                ->exists()
        );

        $this->assertBusinessOwnership(
            $payload,
            $businessId,
            ['appointment_id'],
            fn (int $id): bool => Appointment::query()
                ->whereKey($id)
                ->where('business_id', $businessId)
                ->exists()
        );

        $this->assertBusinessOwnership(
            $payload,
            $businessId,
            ['client_id'],
            fn (int $id): bool => Client::query()
                ->whereKey($id)
                ->where('business_id', $businessId)
                ->exists()
        );

        $this->assertBusinessOwnership(
            $payload,
            $businessId,
            ['product_id', 'materials.*.product_id'],
            fn (int $id): bool => Product::query()
                ->whereKey($id)
                ->where('business_id', $businessId)
                ->exists()
        );

        $this->assertBusinessOwnership(
            $payload,
            $businessId,
            ['service_category_id'],
            fn (int $id): bool => ServiceCategory::query()
                ->whereKey($id)
                ->where('business_id', $businessId)
                ->exists()
        );

        $this->assertBranchConsistency($payload, $businessId);
        $this->assertRouteModelOwnership($request, $businessId);

        return $next($request);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<int, string>  $paths
     */
    protected function assertBusinessOwnership(array $payload, int $businessId, array $paths, callable $existsForBusiness): void
    {
        foreach ($paths as $path) {
            $values = $this->extractValuesByPath($payload, $path);
            foreach ($values as $value) {
                if ($value === null || $value === '') {
                    continue;
                }

                $id = (int) $value;
                if ($id <= 0 || ! $existsForBusiness($id)) {
                    abort(404, 'Recurso no encontrado para este negocio.');
                }
            }
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function assertBranchConsistency(array $payload, int $businessId): void
    {
        $branchId = $this->extractFirstIntByPath($payload, 'branch_id');
        if (! $branchId) {
            return;
        }

        $professionalId = $this->extractFirstIntByPath($payload, 'professional_id');
        if ($professionalId) {
            $professionalBranchId = Professional::query()
                ->whereKey($professionalId)
                ->where('business_id', $businessId)
                ->value('branch_id');

            if ($professionalBranchId !== null && (int) $professionalBranchId !== $branchId) {
                abort(422, 'El profesional no pertenece a la sucursal indicada.');
            }
        }

        $serviceId = $this->extractFirstIntByPath($payload, 'service_id');
        if ($serviceId) {
            $serviceBranchId = Service::query()
                ->whereKey($serviceId)
                ->where('business_id', $businessId)
                ->value('branch_id');

            if ($serviceBranchId !== null && (int) $serviceBranchId !== $branchId) {
                abort(422, 'El servicio no pertenece a la sucursal indicada.');
            }
        }

        $combinedServiceId = $this->extractFirstIntByPath($payload, 'combined_service_id');
        if ($combinedServiceId) {
            $combinedServiceBranchId = CombinedService::query()
                ->whereKey($combinedServiceId)
                ->where('business_id', $businessId)
                ->value('branch_id');

            if ($combinedServiceBranchId !== null && (int) $combinedServiceBranchId !== $branchId) {
                abort(422, 'El servicio combinado no pertenece a la sucursal indicada.');
            }
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<int, mixed>
     */
    protected function extractValuesByPath(array $payload, string $path): array
    {
        $segments = explode('.', $path);
        $current = [$payload];

        foreach ($segments as $segment) {
            $next = [];
            foreach ($current as $node) {
                if (! is_array($node)) {
                    continue;
                }

                if ($segment === '*') {
                    foreach ($node as $child) {
                        $next[] = $child;
                    }
                    continue;
                }

                if (array_key_exists($segment, $node)) {
                    $next[] = $node[$segment];
                }
            }

            $current = $next;
        }

        return $current;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function extractFirstIntByPath(array $payload, string $path): ?int
    {
        $values = $this->extractValuesByPath($payload, $path);
        if ($values === []) {
            return null;
        }

        $value = $values[0];
        if ($value === null || $value === '') {
            return null;
        }

        $id = (int) $value;

        return $id > 0 ? $id : null;
    }

    protected function assertRouteModelOwnership(Request $request, int $businessId): void
    {
        $route = $request->route();
        if (! $route) {
            return;
        }

        foreach ($route->parameters() as $parameter) {
            if (! $parameter instanceof Model) {
                continue;
            }

            $ownedByBusiness = $parameter->getAttribute('business_id');
            if ($ownedByBusiness !== null && (int) $ownedByBusiness !== $businessId) {
                abort(404);
            }

            if ($ownedByBusiness !== null) {
                continue;
            }

            if (method_exists($parameter, 'branch')) {
                $branchBelongs = $parameter->branch()
                    ->where('business_id', $businessId)
                    ->exists();

                if (! $branchBelongs) {
                    abort(404);
                }
            }
        }
    }
}
