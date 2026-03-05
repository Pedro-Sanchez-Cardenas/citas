<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCombinedServiceRequest;
use App\Http\Requests\UpdateCombinedServiceRequest;
use App\Models\CombinedService;
use App\Services\CombinedServiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CombinedServiceController extends Controller
{
    public function __construct(
        protected CombinedServiceService $combinedServiceService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $branchId = $request->query('branch_id') ? (int) $request->query('branch_id') : null;

        $items = $this->combinedServiceService->listForBusiness($businessId, $branchId);

        return response()->json($items);
    }

    public function store(StoreCombinedServiceRequest $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        $combined = $this->combinedServiceService->createForBusiness($businessId, $request->validated());

        return response()->json($combined, 201);
    }

    public function show(Request $request, CombinedService $combinedService): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($combinedService->business_id !== $businessId) {
            abort(404);
        }

        return response()->json($combinedService->load('items'));
    }

    public function update(UpdateCombinedServiceRequest $request, CombinedService $combinedService): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($combinedService->business_id !== $businessId) {
            abort(404);
        }

        $updated = $this->combinedServiceService->update($combinedService, $request->validated());

        return response()->json($updated);
    }

    public function destroy(Request $request, CombinedService $combinedService): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($combinedService->business_id !== $businessId) {
            abort(404);
        }

        $this->combinedServiceService->delete($combinedService);

        return response()->json(['deleted' => true]);
    }
}

