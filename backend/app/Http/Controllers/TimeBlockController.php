<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTimeBlockRequest;
use App\Models\Branch;
use App\Models\Professional;
use App\Models\TimeBlock;
use App\Services\TimeBlockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimeBlockController extends Controller
{
    public function __construct(
        protected TimeBlockService $timeBlockService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        $query = TimeBlock::query()
            ->whereHas('branch', fn ($q) => $q->where('business_id', $businessId))
            ->where('branch_id', '!=', null);

        if ($branchId = $request->query('branch_id')) {
            $query->where('branch_id', (int) $branchId);
        }

        if ($professionalId = $request->query('professional_id')) {
            $query->where('professional_id', (int) $professionalId);
        }

        $blocks = $query
            ->orderBy('start_at')
            ->paginate(50);

        return response()->json($blocks);
    }

    public function store(StoreTimeBlockRequest $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $data = $request->validated();

        if (! $this->belongsToBusiness($businessId, (int) $data['branch_id'], $data['professional_id'] ?? null)) {
            abort(404);
        }

        $block = $this->timeBlockService->createForBusiness($businessId, $data);

        return response()->json($block, 201);
    }

    public function show(Request $request, TimeBlock $block): JsonResponse
    {
        $this->authorizeBlock($request, $block);

        return response()->json($block);
    }

    public function destroy(Request $request, TimeBlock $block): JsonResponse
    {
        $this->authorizeBlock($request, $block);
        $block->delete();

        return response()->json(['deleted' => true]);
    }

    protected function authorizeBlock(Request $request, TimeBlock $block): void
    {
        $businessId = (int) $request->user()->business_id;
        $belongs = $block->branch()
            ->where('business_id', $businessId)
            ->exists();

        if (! $belongs) {
            abort(404);
        }
    }

    protected function belongsToBusiness(int $businessId, int $branchId, ?int $professionalId): bool
    {
        $branchValid = $this->branchBelongsToBusiness($businessId, $branchId);
        if (! $branchValid) {
            return false;
        }

        if (! $professionalId) {
            return true;
        }

        return Professional::query()
            ->whereKey($professionalId)
            ->where('business_id', $businessId)
            ->where('branch_id', $branchId)
            ->exists();
    }

    protected function branchBelongsToBusiness(int $businessId, int $branchId): bool
    {
        return Branch::query()
            ->whereKey($branchId)
            ->where('business_id', $businessId)
            ->exists();
    }
}

