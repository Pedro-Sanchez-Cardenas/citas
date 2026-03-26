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

    public function updateBranding(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'logo_url' => ['nullable', 'url', 'max:2048'],
            'hero_image_url' => ['nullable', 'url', 'max:2048'],
            'primary_color' => ['nullable', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'public_booking_title' => ['nullable', 'string', 'max:120'],
            'public_booking_subtitle' => ['nullable', 'string', 'max:255'],
        ]);

        $branding = $this->businessSetupService->updateBrandingForAuthenticatedUser(
            $request->user(),
            $validated
        );

        return response()->json([
            'message' => 'Branding actualizado',
            'branding' => $branding,
        ]);
    }
}

