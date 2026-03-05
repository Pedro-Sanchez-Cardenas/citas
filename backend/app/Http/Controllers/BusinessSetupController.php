<?php

namespace App\Http\Controllers;

use App\Services\BusinessSetupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BusinessSetupController extends Controller
{
    public function __construct(
        protected BusinessSetupService $businessSetupService
    ) {}

    /**
     * Estado de onboarding/configuración inicial del negocio del usuario autenticado.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $this->businessSetupService->getSetupStatus($user);

        return response()->json($data);
    }
}

