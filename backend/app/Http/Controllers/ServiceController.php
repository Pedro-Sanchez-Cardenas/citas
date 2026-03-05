<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServiceRequest;
use App\Http\Requests\UpdateServiceRequest;
use App\Models\Service;
use App\Services\ServiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function __construct(
        protected ServiceService $serviceService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $branchId = $request->query('branch_id') ? (int) $request->query('branch_id') : null;
        $services = $this->serviceService->listForBusiness($businessId, $branchId);

        return response()->json($services);
    }

    public function store(StoreServiceRequest $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $service = $this->serviceService->createForBusiness($businessId, $request->validated());

        return response()->json($service, 201);
    }

    public function show(Request $request, Service $service): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($service->business_id !== $businessId) {
            abort(404);
        }

        return response()->json($service);
    }

    public function update(UpdateServiceRequest $request, Service $service): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($service->business_id !== $businessId) {
            abort(404);
        }

        $updated = $this->serviceService->update($service, $request->validated());

        return response()->json($updated);
    }

    public function destroy(Request $request, Service $service): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($service->business_id !== $businessId) {
            abort(404);
        }

        $this->serviceService->delete($service);

        return response()->json(['deleted' => true]);
    }
}

