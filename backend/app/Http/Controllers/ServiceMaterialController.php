<?php

namespace App\Http\Controllers;

use App\Http\Requests\SyncServiceMaterialsRequest;
use App\Models\Product;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceMaterialController extends Controller
{
    public function index(Request $request, Service $service): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($service->business_id !== $businessId) {
            abort(404);
        }

        $materials = $service->products()->get();

        return response()->json($materials);
    }

    public function sync(SyncServiceMaterialsRequest $request, Service $service): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($service->business_id !== $businessId) {
            abort(404);
        }

        $materials = $request->validated()['materials'] ?? [];

        $syncData = [];
        foreach ($materials as $material) {
            $product = Product::query()
                ->where('business_id', $businessId)
                ->where('id', $material['product_id'])
                ->first();

            if (! $product) {
                continue;
            }

            $syncData[$product->id] = ['quantity' => $material['quantity']];
        }

        $service->products()->sync($syncData);

        return response()->json($service->products()->get());
    }
}

