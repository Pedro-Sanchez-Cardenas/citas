<?php

namespace App\Http\Controllers;

use App\Services\PublicBookingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicBookingController extends Controller
{
    public function __construct(
        protected PublicBookingService $publicBookingService
    ) {
    }

    public function services(string $businessSlug, Request $request): JsonResponse
    {
        $payload = $this->publicBookingService->getCatalog($businessSlug);

        return response()->json($payload);
    }

    public function professionals(string $businessSlug, Request $request): JsonResponse
    {
        $professionals = $this->publicBookingService->getProfessionals($businessSlug);

        return response()->json($professionals);
    }

    public function availability(string $businessSlug, Request $request): JsonResponse
    {
        $payload = $this->publicBookingService->getAvailability($businessSlug, $request);

        return response()->json($payload);
    }
}
