<?php

namespace App\Http\Controllers;

use App\Http\Requests\SyncServiceProfessionalsRequest;
use App\Models\Professional;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceProfessionalController extends Controller
{
    public function index(Request $request, Service $service): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($service->business_id !== $businessId) {
            abort(404);
        }

        $professionals = $service->professionals()->get();

        return response()->json($professionals);
    }

    public function sync(SyncServiceProfessionalsRequest $request, Service $service): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($service->business_id !== $businessId) {
            abort(404);
        }

        $ids = $request->validated()['professional_ids'] ?? [];

        // Aseguramos que solo se asignen profesionales del mismo negocio
        $validIds = Professional::query()
            ->where('business_id', $businessId)
            ->whereIn('id', $ids)
            ->pluck('id')
            ->all();

        $service->professionals()->sync($validIds);

        return response()->json($service->professionals()->get());
    }
}

