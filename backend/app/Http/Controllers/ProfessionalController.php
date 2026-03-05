<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProfessionalRequest;
use App\Http\Requests\UpdateProfessionalRequest;
use App\Models\Professional;
use App\Services\ProfessionalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfessionalController extends Controller
{
    public function __construct(
        protected ProfessionalService $professionalService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $branchId = $request->query('branch_id') ? (int) $request->query('branch_id') : null;
        $professionals = $this->professionalService->listForBusiness($businessId, $branchId);

        return response()->json($professionals);
    }

    public function store(StoreProfessionalRequest $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $professional = $this->professionalService->createForBusiness($businessId, $request->validated());

        return response()->json($professional, 201);
    }

    public function show(Request $request, Professional $professional): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($professional->business_id !== $businessId) {
            abort(404);
        }

        return response()->json($professional);
    }

    public function update(UpdateProfessionalRequest $request, Professional $professional): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($professional->business_id !== $businessId) {
            abort(404);
        }

        $updated = $this->professionalService->update($professional, $request->validated());

        return response()->json($updated);
    }

    public function destroy(Request $request, Professional $professional): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($professional->business_id !== $businessId) {
            abort(404);
        }

        $this->professionalService->delete($professional);

        return response()->json(['deleted' => true]);
    }
}

