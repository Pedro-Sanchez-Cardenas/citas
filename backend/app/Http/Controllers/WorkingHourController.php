<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\InteractsWithBusiness;
use App\Http\Requests\StoreWorkingHourRequest;
use App\Http\Requests\UpdateWorkingHourRequest;
use App\Models\WorkingHour;
use App\Services\WorkingHourService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkingHourController extends Controller
{
    use InteractsWithBusiness;

    public function __construct(
        protected WorkingHourService $workingHourService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $branchId = $request->query('branch_id') ? (int) $request->query('branch_id') : null;
        $professionalId = $request->query('professional_id') ? (int) $request->query('professional_id') : null;

        $items = $this->workingHourService->listForBusiness($businessId, $branchId, $professionalId);

        return response()->json($items);
    }

    public function store(StoreWorkingHourRequest $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $workingHour = $this->workingHourService->createForBusiness($businessId, $request->validated());

        return response()->json($workingHour, 201);
    }

    public function show(Request $request, WorkingHour $workingHour): JsonResponse
    {
        $this->assertModelBelongsToRequestBusiness($workingHour, $request);

        return response()->json($workingHour);
    }

    public function update(UpdateWorkingHourRequest $request, WorkingHour $workingHour): JsonResponse
    {
        $this->assertModelBelongsToRequestBusiness($workingHour, $request);

        $updated = $this->workingHourService->update($workingHour, $request->validated());

        return response()->json($updated);
    }

    public function destroy(Request $request, WorkingHour $workingHour): JsonResponse
    {
        $this->assertModelBelongsToRequestBusiness($workingHour, $request);

        $this->workingHourService->delete($workingHour);

        return response()->json(['deleted' => true]);
    }
}

