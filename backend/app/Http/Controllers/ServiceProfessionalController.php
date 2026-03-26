<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\InteractsWithBusiness;
use App\Http\Requests\SyncServiceProfessionalsRequest;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\ServiceProfessionalsService;

class ServiceProfessionalController extends Controller
{
    use InteractsWithBusiness;

    public function __construct(
        protected ServiceProfessionalsService $serviceProfessionalsService
    ) {
    }

    public function index(Request $request, Service $service): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        $this->assertModelBelongsToRequestBusiness($service, $request);

        $professionals = $this->serviceProfessionalsService->listForService($service);
        return response()->json($professionals);
    }

    public function sync(SyncServiceProfessionalsRequest $request, Service $service): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        $this->assertModelBelongsToRequestBusiness($service, $request);

        $ids = $request->validated()['professional_ids'] ?? [];

        $professionals = $this->serviceProfessionalsService->syncForService($service, $businessId, $ids);
        return response()->json($professionals);
    }
}

