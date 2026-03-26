<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\InteractsWithBusiness;
use App\Http\Requests\StoreClientRequest;
use App\Http\Requests\UpdateClientRequest;
use App\Http\Resources\ClientResource;
use App\Models\Client;
use App\Services\ClientService;
use App\Services\ProfessionalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    use InteractsWithBusiness;

    public function __construct(
        protected ClientService $clientService,
        protected ProfessionalService $professionalService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $clients = $this->clientService->paginateForAuthenticatedUser($request->user(), $businessId);

        return ClientResource::collection($clients)->response();
    }

    public function store(StoreClientRequest $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $data = $request->validated();
        $photo = $data['photo'] ?? $request->file('photo');
        unset($data['photo']);

        $data['created_by_user_id'] = (int) $request->user()->id;

        $client = $this->clientService->createWithOptionalPhoto($businessId, $data, $photo);

        return (new ClientResource($client))->response()->setStatusCode(201);
    }

    public function show(Request $request, Client $client): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        $this->assertModelBelongsToRequestBusiness($client, $request);

        $user = $request->user();
        if ($user?->hasRole('worker')) {
            [, $workerBranchId] = $this->professionalService->requireWorkerBranchContext(
                $businessId,
                $user->professional_id
            );

            if (! is_null($client->branch_id) && (int) $client->branch_id !== $workerBranchId) {
                abort(404);
            }
        }

        return (new ClientResource($client))->response();
    }

    public function update(UpdateClientRequest $request, Client $client): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        $this->assertModelBelongsToRequestBusiness($client, $request);

        $data = $request->validated();
        $photo = $data['photo'] ?? null;
        unset($data['photo']);

        $user = $request->user();
        if ($user?->hasRole('worker')) {
            [, $workerBranchId] = $this->professionalService->requireWorkerBranchContext(
                $businessId,
                $user->professional_id
            );

            if (! is_null($client->branch_id) && (int) $client->branch_id !== $workerBranchId) {
                abort(404);
            }
        }

        $updated = $this->clientService->updateWithOptionalPhoto($client, $businessId, $data, $photo);

        return (new ClientResource($updated))->response();
    }

    public function destroy(Request $request, Client $client): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        $this->assertModelBelongsToRequestBusiness($client, $request);

        $user = $request->user();
        if ($user?->hasRole('worker')) {
            [, $workerBranchId] = $this->professionalService->requireWorkerBranchContext(
                $businessId,
                $user->professional_id
            );

            if (! is_null($client->branch_id) && (int) $client->branch_id !== $workerBranchId) {
                abort(404);
            }
        }

        $this->clientService->delete($client);

        return response()->json(['deleted' => true]);
    }

    public function history(Request $request, Client $client): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        $this->assertModelBelongsToRequestBusiness($client, $request);

        $user = $request->user();
        if ($user?->hasRole('worker')) {
            [, $workerBranchId] = $this->professionalService->requireWorkerBranchContext(
                $businessId,
                $user->professional_id
            );

            if (! is_null($client->branch_id) && (int) $client->branch_id !== $workerBranchId) {
                abort(404);
            }
        }

        $payload = $this->clientService->historyPayload($client);

        return response()->json([
            'client' => new ClientResource($client),
            'appointments' => $payload['appointments'],
            'media' => $payload['media'],
        ]);
    }
}
