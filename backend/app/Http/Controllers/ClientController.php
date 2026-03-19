<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\InteractsWithBusiness;
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
    use InteractsWithBusiness;

    public function __construct(
        protected ClientService $clientService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $user = $request->user();

        if ($user?->hasRole('worker')) {
            $workerProfessionalId = (int) ($user->professional_id ?? 0);
            if ($workerProfessionalId <= 0) {
                abort(403, 'Usuario worker sin profesional asignado.');
            }

            $workerBranchId = (int) (Professional::query()
                ->whereKey($workerProfessionalId)
                ->value('branch_id') ?? 0);

            if ($workerBranchId <= 0) {
                abort(403, 'Usuario worker sin sucursal asignada.');
            }

            $clients = Client::query()
                ->where('business_id', $businessId)
                ->where(function ($q) use ($workerBranchId) {
                    $q->where('branch_id', $workerBranchId)->orWhereNull('branch_id');
                })
                ->orderBy('name')
                ->paginate(15);

            return ClientResource::collection($clients)->response();
        }

        $clients = $this->clientService->listForBusiness($businessId);

        return ClientResource::collection($clients)->response();
    }

    public function store(StoreClientRequest $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $data = $request->validated();
        $photo = $data['photo'] ?? $request->file('photo');
        unset($data['photo']);

        $data['created_by_user_id'] = (int) $request->user()->id;

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

        $this->assertModelBelongsToRequestBusiness($client, $request);

        $user = $request->user();
        if ($user?->hasRole('worker')) {
            $workerProfessionalId = (int) ($user->professional_id ?? 0);
            if ($workerProfessionalId <= 0) {
                abort(403, 'Usuario worker sin profesional asignado.');
            }

            $workerBranchId = (int) (Professional::query()
                ->whereKey($workerProfessionalId)
                ->value('branch_id') ?? 0);

            if ($workerBranchId <= 0) {
                abort(404);
            }

            // Para el worker: puede ver/administrar clientes dentro de su branch (o sin branch asignada).
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
            $workerProfessionalId = (int) ($user->professional_id ?? 0);
            if ($workerProfessionalId <= 0) {
                abort(403, 'Usuario worker sin profesional asignado.');
            }

            $workerBranchId = (int) (Professional::query()
                ->whereKey($workerProfessionalId)
                ->value('branch_id') ?? 0);

            if ($workerBranchId <= 0) {
                abort(404);
            }

            if (! is_null($client->branch_id) && (int) $client->branch_id !== $workerBranchId) {
                abort(404);
            }
        }

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

        $this->assertModelBelongsToRequestBusiness($client, $request);

        $user = $request->user();
        if ($user?->hasRole('worker')) {
            $workerProfessionalId = (int) ($user->professional_id ?? 0);
            if ($workerProfessionalId <= 0) {
                abort(403, 'Usuario worker sin profesional asignado.');
            }

            $workerBranchId = (int) (Professional::query()
                ->whereKey($workerProfessionalId)
                ->value('branch_id') ?? 0);

            if ($workerBranchId <= 0) {
                abort(404);
            }

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
            $workerProfessionalId = (int) ($user->professional_id ?? 0);
            if ($workerProfessionalId <= 0) {
                abort(403, 'Usuario worker sin profesional asignado.');
            }

            $workerBranchId = (int) (Professional::query()
                ->whereKey($workerProfessionalId)
                ->value('branch_id') ?? 0);

            if ($workerBranchId <= 0) {
                abort(404);
            }

            if (! is_null($client->branch_id) && (int) $client->branch_id !== $workerBranchId) {
                abort(404);
            }
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

