<?php

namespace App\Http\Controllers;

use App\Services\BusinessSetupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

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
            'logo_file' => ['sometimes', 'nullable', 'image', 'max:5120'],
            'hero_image_file' => ['sometimes', 'nullable', 'image', 'max:8192'],
            'primary_color' => ['sometimes', 'nullable', 'regex:/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/'],
            'public_booking_title' => ['sometimes', 'nullable', 'string', 'max:120'],
            'public_booking_subtitle' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        /** @var UploadedFile|null $logoFile */
        $logoFile = $request->file('logo_file');
        /** @var UploadedFile|null $heroFile */
        $heroFile = $request->file('hero_image_file');

        $branding = $this->businessSetupService->updateBrandingForAuthenticatedUser(
            $request->user(),
            $validated,
            $logoFile,
            $heroFile
        );

        return response()->json([
            'message' => 'Branding actualizado',
            'branding' => $branding,
        ]);
    }
}
