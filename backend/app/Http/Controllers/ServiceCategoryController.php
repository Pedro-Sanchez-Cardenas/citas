<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServiceCategoryRequest;
use App\Http\Requests\UpdateServiceCategoryRequest;
use App\Models\ServiceCategory;
use App\Services\ServiceCategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceCategoryController extends Controller
{
    public function __construct(
        protected ServiceCategoryService $serviceCategoryService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $categories = $this->serviceCategoryService->listForBusiness($businessId);

        return response()->json($categories);
    }

    public function store(StoreServiceCategoryRequest $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $category = $this->serviceCategoryService->createForBusiness($businessId, $request->validated());

        return response()->json($category, 201);
    }

    public function show(Request $request, ServiceCategory $serviceCategory): JsonResponse
    {
        // El binding ya trae la categoría; validamos que pertenezca al negocio del usuario
        $businessId = (int) $request->user()->business_id;

        if ($serviceCategory->business_id !== $businessId) {
            abort(404);
        }

        return response()->json($serviceCategory);
    }

    public function update(UpdateServiceCategoryRequest $request, ServiceCategory $serviceCategory): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($serviceCategory->business_id !== $businessId) {
            abort(404);
        }

        $updated = $this->serviceCategoryService->update($serviceCategory, $request->validated());

        return response()->json($updated);
    }

    public function destroy(Request $request, ServiceCategory $serviceCategory): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($serviceCategory->business_id !== $businessId) {
            abort(404);
        }

        $this->serviceCategoryService->delete($serviceCategory);

        return response()->json(['deleted' => true]);
    }
}

