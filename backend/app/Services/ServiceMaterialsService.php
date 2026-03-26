<?php

namespace App\Services;

use App\Models\Service;
use Illuminate\Support\Collection;

class ServiceMaterialsService
{
    public function __construct(
        protected ProductService $products
    ) {
    }

    public function listForService(Service $service): Collection
    {
        return $service->products()->get();
    }

    /**
     * Sincroniza productos (materiales) con cantidades por servicio.
     *
     * @param array<int, array{product_id: int, quantity: int|float|string}> $materials
     */
    public function syncForService(Service $service, int $businessId, array $materials): Collection
    {
        $incomingProductIds = array_map(fn ($m) => $m['product_id'] ?? null, $materials);
        $validIds = $this->products->filterIdsForBusiness($businessId, $incomingProductIds);
        $validIdSet = array_flip($validIds);

        $syncData = [];
        foreach ($materials as $material) {
            $productId = $material['product_id'] ?? null;
            if (! $productId || ! isset($validIdSet[(int) $productId])) {
                continue;
            }

            $syncData[(int) $productId] = ['quantity' => $material['quantity']];
        }

        $service->products()->sync($syncData);

        return $service->products()->get();
    }
}

