<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTimeBlockRequest;
use App\Models\TimeBlock;
use App\Services\TimeBlockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimeBlockController extends Controller
{
    public function __construct(
        protected TimeBlockService $timeBlockService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $branchId = $request->query('branch_id') ? (int) $request->query('branch_id') : null;
        $professionalId = $request->query('professional_id')
            ? (int) $request->query('professional_id')
            : null;

        $blocks = $this->timeBlockService->listForBusiness($businessId, $branchId, $professionalId, 50);

        return response()->json($blocks);
    }

    public function store(StoreTimeBlockRequest $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $data = $request->validated();

        if (! $this->timeBlockService->canCreateForBusiness($businessId, (int) $data['branch_id'], $data['professional_id'] ?? null)) {
            abort(404);
        }

        $block = $this->timeBlockService->createForBusiness($businessId, $data);

        return response()->json($block, 201);
    }

    public function show(Request $request, TimeBlock $block): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        if (! $this->timeBlockService->canAccessBlock($businessId, $block)) {
            abort(404);
        }

        return response()->json($block);
    }

    public function destroy(Request $request, TimeBlock $block): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        if (! $this->timeBlockService->canAccessBlock($businessId, $block)) {
            abort(404);
        }
        $this->timeBlockService->deleteForBusiness($businessId, $block);

        return response()->json(['deleted' => true]);
    }
}
