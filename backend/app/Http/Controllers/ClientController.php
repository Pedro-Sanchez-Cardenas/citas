<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Models\Client;
use App\Services\ClientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function __construct(
        protected ClientService $clientService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $clients = $this->clientService->listForBusiness($businessId);

        return response()->json($clients);
    }

    public function store(StoreClientRequest $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $client = $this->clientService->createForBusiness($businessId, $request->validated());

        return response()->json($client, 201);
    }

    public function show(Request $request, Client $client): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($client->business_id !== $businessId) {
            abort(404);
        }

        return response()->json($client);
    }

    public function update(UpdateClientRequest $request, Client $client): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($client->business_id !== $businessId) {
            abort(404);
        }

        $updated = $this->clientService->update($client, $request->validated());

        return response()->json($updated);
    }

    public function destroy(Request $request, Client $client): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($client->business_id !== $businessId) {
            abort(404);
        }

        $this->clientService->delete($client);

        return response()->json(['deleted' => true]);
    }

    public function history(Request $request, Client $client): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($client->business_id !== $businessId) {
            abort(404);
        }

        $appointments = $client->appointments()
            ->with(['branch', 'professional', 'service', 'combinedService', 'payments'])
            ->orderByDesc('start_at')
            ->get();

        $media = $client->media()
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'client' => $client,
            'appointments' => $appointments,
            'media' => $media,
        ]);
    }
}

