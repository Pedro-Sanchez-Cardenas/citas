<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClientMediaRequest;
use App\Models\Client;
use App\Models\ClientMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientMediaController extends Controller
{
    public function index(Request $request, Client $client): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($client->business_id !== $businessId) {
            abort(404);
        }

        $media = $client->media()
            ->orderByDesc('created_at')
            ->get();

        return response()->json($media);
    }

    public function store(StoreClientMediaRequest $request, Client $client): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($client->business_id !== $businessId) {
            abort(404);
        }

        $data = $request->validated();
        $data['business_id'] = $businessId;
        $data['client_id'] = $client->id;

        $media = ClientMedia::create($data);

        return response()->json($media, 201);
    }

    public function destroy(Request $request, ClientMedia $media): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($media->business_id !== $businessId) {
            abort(404);
        }

        $media->delete();

        return response()->json(['deleted' => true]);
    }
}

