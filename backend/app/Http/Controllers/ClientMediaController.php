<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\InteractsWithBusiness;
use App\Http\Requests\StoreClientMediaRequest;
use App\Models\Client;
use App\Models\ClientMedia;
use App\Services\ClientMediaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientMediaController extends Controller
{
    use InteractsWithBusiness;

    public function __construct(
        protected ClientMediaService $clientMediaService
    ) {
    }

    public function index(Request $request, Client $client): JsonResponse
    {
        $this->assertModelBelongsToRequestBusiness($client, $request);

        $media = $this->clientMediaService->listForClient($client);

        return response()->json($media);
    }

    public function store(StoreClientMediaRequest $request, Client $client): JsonResponse
    {
        $this->assertModelBelongsToRequestBusiness($client, $request);

        $data = $request->validated();
        $media = $this->clientMediaService->createForClient($client, $data);

        return response()->json($media, 201);
    }

    public function destroy(Request $request, ClientMedia $media): JsonResponse
    {
        $media = $this->clientMediaService->loadClientForAuthorization($media);
        $this->assertModelBelongsToRequestBusiness($media->client, $request);

        $this->clientMediaService->delete($media);

        return response()->json(['deleted' => true]);
    }
}
