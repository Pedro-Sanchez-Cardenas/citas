<?php

namespace App\Http\Controllers;

use App\Services\BusinessSetupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

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

        $user = $request->user();
        $business = $user?->business;
        if (! $business) {
            abort(404, 'No se encontró negocio asociado al usuario.');
        }

        $settings = is_array($business->settings) ? $business->settings : [];
        Arr::set($settings, 'branding.logo_url', $validated['logo_url'] ?? null);
        Arr::set($settings, 'branding.hero_image_url', $validated['hero_image_url'] ?? null);
        Arr::set($settings, 'branding.primary_color', $validated['primary_color'] ?? null);
        Arr::set($settings, 'branding.public_booking_title', $validated['public_booking_title'] ?? null);
        Arr::set($settings, 'branding.public_booking_subtitle', $validated['public_booking_subtitle'] ?? null);

        $business->settings = $settings;
        $business->save();

        return response()->json([
            'message' => 'Branding actualizado',
            'branding' => Arr::get($settings, 'branding', []),
        ]);
    }
}

