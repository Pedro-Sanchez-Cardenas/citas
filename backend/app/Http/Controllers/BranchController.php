<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $branches = Branch::query()
            ->where('business_id', $businessId)
            ->orderBy('name')
            ->get();

        return response()->json($branches);
    }
}
