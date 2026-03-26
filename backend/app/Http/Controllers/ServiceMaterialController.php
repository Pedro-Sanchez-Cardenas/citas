<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\InteractsWithBusiness;
use App\Http\Requests\SyncServiceMaterialsRequest;
use App\Models\Service;
use App\Services\ServiceMaterialsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceMaterialController extends Controller
{
    use InteractsWithBusiness;

    public function __construct(
        protected ServiceMaterialsService $serviceMaterialsService
    ) {
    }

    public function index(Request $request, Service $service): JsonResponse
    {
        $this->assertModelBelongsToRequestBusiness($service, $request);

        $materials = $this->serviceMaterialsService->listForService($service);
        return response()->json($materials);
    }

    public function sync(SyncServiceMaterialsRequest $request, Service $service): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        $this->assertModelBelongsToRequestBusiness($service, $request);

        $materials = $request->validated()['materials'] ?? [];
        $products = $this->serviceMaterialsService->syncForService($service, $businessId, $materials);
        return response()->json($products);
    }
}

