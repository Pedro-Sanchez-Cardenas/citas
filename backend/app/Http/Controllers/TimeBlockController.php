<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTimeBlockRequest;
use App\Models\TimeBlock;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimeBlockController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = TimeBlock::query()
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
        $block = TimeBlock::create($request->validated());

        return response()->json($block, 201);
    }

    public function show(TimeBlock $block): JsonResponse
    {
        return response()->json($block);
    }

    public function destroy(TimeBlock $block): JsonResponse
    {
        $block->delete();

        return response()->json(['deleted' => true]);
    }
}

