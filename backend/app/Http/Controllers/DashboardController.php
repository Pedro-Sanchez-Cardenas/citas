<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $user?->load('business');
        $data = $this->dashboardService->getDashboardData($user);

        return response()->json([
            'message' => $data['message'],
            'user' => $data['user'] ? new UserResource($data['user']) : null,
            'cards' => $data['cards'],
        ]);
    }
}
