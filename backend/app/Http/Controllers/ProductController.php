<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Product;
use App\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(
        protected ProductRepositoryInterface $products
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $items = $this->products->paginateForBusiness($businessId);

        return response()->json($items);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $product = $this->products->createForBusiness($businessId, $request->validated());

        return response()->json($product, 201);
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($product->business_id !== $businessId) {
            abort(404);
        }

        return response()->json($product);
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($product->business_id !== $businessId) {
            abort(404);
        }

        $updated = $this->products->update($product, $request->validated());

        return response()->json($updated);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($product->business_id !== $businessId) {
            abort(404);
        }

        $this->products->delete($product);

        return response()->json(['deleted' => true]);
    }
}

