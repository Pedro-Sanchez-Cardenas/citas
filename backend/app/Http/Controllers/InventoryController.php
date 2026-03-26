<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdjustStockRequest;
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

        $stock = $this->inventoryService->adjustStockFromValidated($businessId, $data);

        return response()->json($stock);
    }
}
