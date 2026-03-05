<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        protected ReportService $reportService
    ) {
    }

    public function businessSummary(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        [$from, $to] = $this->resolveRange($request);

        $data = $this->reportService->businessSummary($businessId, $from, $to);

        return response()->json($data);
    }

    public function professionals(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        [$from, $to] = $this->resolveRange($request);
        $branchId = $request->query('branch_id') ? (int) $request->query('branch_id') : null;

        $data = $this->reportService->professionalPerformance($businessId, $from, $to, $branchId);

        return response()->json($data);
    }

    public function services(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        [$from, $to] = $this->resolveRange($request);
        $branchId = $request->query('branch_id') ? (int) $request->query('branch_id') : null;

        $data = $this->reportService->servicePerformance($businessId, $from, $to, $branchId);

        return response()->json($data);
    }

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    protected function resolveRange(Request $request): array
    {
        $to = $request->query('to')
            ? new CarbonImmutable($request->query('to'))
            : CarbonImmutable::today();

        $from = $request->query('from')
            ? new CarbonImmutable($request->query('from'))
            : $to->subDays(29);

        return [$from->startOfDay(), $to->endOfDay()];
    }
}

