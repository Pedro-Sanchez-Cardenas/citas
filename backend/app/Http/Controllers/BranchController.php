<?php

namespace App\Http\Controllers;

use App\Services\BranchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function __construct(
        protected BranchService $branchService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        $branches = $this->branchService->listForBusiness($businessId);

        return response()->json($branches);
    }
}
