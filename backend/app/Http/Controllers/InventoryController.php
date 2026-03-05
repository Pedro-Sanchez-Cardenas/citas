<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdjustStockRequest;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {
    }

    public function stocks(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $branchId = (int) $request->query('branch_id');

        $stocks = $this->inventoryService->listStocksForBranch($businessId, $branchId);

        return response()->json($stocks);
    }

    public function adjust(AdjustStockRequest $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $data = $request->validated();

        /** @var Product $product */
        $product = Product::findOrFail($data['product_id']);
        if ($product->business_id !== $businessId) {
            abort(404);
        }

        $stock = $this->inventoryService->adjustStock(
            $businessId,
            $data['branch_id'],
            $product,
            (float) $data['quantity'],
            $data['type'],
            $data['reason'] ?? null,
            null,
        );

        return response()->json($stock);
    }
}

