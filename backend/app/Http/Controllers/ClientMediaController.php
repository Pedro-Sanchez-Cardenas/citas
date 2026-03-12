<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\InteractsWithBusiness;
use App\Http\Requests\StoreClientMediaRequest;
use App\Models\Client;
use App\Models\ClientMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientMediaController extends Controller
{
    use InteractsWithBusiness;

    public function index(Request $request, Client $client): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        $this->assertModelBelongsToRequestBusiness($client, $request);

        $media = $client->media()
            ->orderByDesc('created_at')
            ->get();

        return response()->json($media);
    }

    public function store(StoreClientMediaRequest $request, Client $client): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        $this->assertModelBelongsToRequestBusiness($client, $request);

        $data = $request->validated();
        $data['business_id'] = $businessId;
        $data['client_id'] = $client->id;

        $media = ClientMedia::create($data);

        return response()->json($media, 201);
    }

    public function destroy(Request $request, ClientMedia $media): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        $this->assertModelBelongsToRequestBusiness($media, $request);

        $media->delete();

        return response()->json(['deleted' => true]);
    }
}

