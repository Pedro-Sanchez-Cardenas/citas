<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAutomationRequest;
use App\Http\Requests\UpdateAutomationRequest;
use App\Models\Automation;
use App\Services\AutomationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AutomationController extends Controller
{
    public function __construct(
        protected AutomationService $automationService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $automations = $this->automationService->listForBusiness($businessId);

        return response()->json($automations);
    }

    public function store(StoreAutomationRequest $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $automation = $this->automationService->createForBusiness($businessId, $request->validated());

        return response()->json($automation, 201);
    }

    public function show(Request $request, Automation $automation): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($automation->business_id !== $businessId) {
            abort(404);
        }

        return response()->json($automation);
    }

    public function update(UpdateAutomationRequest $request, Automation $automation): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($automation->business_id !== $businessId) {
            abort(404);
        }

        $updated = $this->automationService->update($automation, $request->validated());

        return response()->json($updated);
    }

    public function destroy(Request $request, Automation $automation): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($automation->business_id !== $businessId) {
            abort(404);
        }

        $this->automationService->delete($automation);

        return response()->json(['deleted' => true]);
    }
}

