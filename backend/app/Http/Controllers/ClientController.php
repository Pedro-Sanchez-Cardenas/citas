<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Services\ClientService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

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

        return ClientResource::collection($clients)->response();
    }

    public function store(StoreClientRequest $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $data = $request->validated();
        $photo = $data['photo'] ?? $request->file('photo');
        unset($data['photo']);

        $client = $this->clientService->createForBusiness($businessId, $data);

        if ($photo) {
            $path = $photo->store(
                sprintf('clients/%s/%s', $businessId, $client->id),
                'public'
            );
            $client->update(['photo_path' => $path]);
            $client->refresh();
        }

        return (new ClientResource($client))->response()->setStatusCode(201);
    }

    public function show(Request $request, Client $client): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($client->business_id !== $businessId) {
            abort(404);
        }

        return (new ClientResource($client))->response();
    }

    public function update(UpdateClientRequest $request, Client $client): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($client->business_id !== $businessId) {
            abort(404);
        }

        $data = $request->validated();
        $photo = $data['photo'] ?? null;
        unset($data['photo']);

        if ($photo) {
            $dir = sprintf('clients/%s/%s', $businessId, $client->id);
            if ($client->photo_path) {
                Storage::disk('public')->delete($client->photo_path);
            }
            $path = $photo->store($dir, 'public');
            $data['photo_path'] = $path;
        }

        $updated = $this->clientService->update($client, $data);

        return (new ClientResource($updated))->response();
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
            'client' => new ClientResource($client),
            'appointments' => $appointments,
            'media' => $media,
        ]);
    }
}

