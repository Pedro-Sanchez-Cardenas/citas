<?php

namespace App\Services;

use App\Models\Product;
use App\Models\ProductMovement;
use App\Models\ProductStock;
use App\Repositories\Contracts\ProductMovementRepositoryInterface;
use App\Repositories\Contracts\ProductRepositoryInterface;
use App\Repositories\Contracts\ProductStockRepositoryInterface;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    public function __construct(
        protected ProductRepositoryInterface $products,
        protected ProductStockRepositoryInterface $stocks,
        protected ProductMovementRepositoryInterface $movements
    ) {
    }

    public function listStocksForBranch(int $businessId, int $branchId): Collection
    {
        return $this->stocks->getForBranch($businessId, $branchId);
    }

    public function adjustStock(
        int $businessId,
        int $branchId,
        Product $product,
        float $quantity,
        string $type,
        ?string $reason = null,
        ?int $appointmentId = null
    ): ProductStock {
        return DB::transaction(function () use ($businessId, $branchId, $product, $quantity, $type, $reason, $appointmentId) {
            $stock = $this->stocks->findForBranch($businessId, $branchId, $product->id)
                ?? new ProductStock([
                    'business_id' => $businessId,
                    'branch_id' => $branchId,
                    'product_id' => $product->id,
                    'quantity' => 0,
                ]);

            if ($type === 'in') {
                $stock->quantity += $quantity;
            } else {
                $stock->quantity -= $quantity;
            }

            $this->stocks->save($stock);

            $movement = new ProductMovement([
                'business_id' => $businessId,
                'branch_id' => $branchId,
                'product_id' => $product->id,
                'appointment_id' => $appointmentId,
                'type' => $type,
                'quantity' => $quantity,
                'reason' => $reason,
            ]);

            $this->movements->create($movement);

            return $stock;
        });
    }
}

