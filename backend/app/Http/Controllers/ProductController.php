<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\InteractsWithBusiness;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Repositories\Contracts\ProductRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    use InteractsWithBusiness;

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

        $this->assertModelBelongsToRequestBusiness($product, $request);

        return response()->json($product);
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        $this->assertModelBelongsToRequestBusiness($product, $request);

        $updated = $this->products->update($product, $request->validated());

        return response()->json($updated);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        $this->assertModelBelongsToRequestBusiness($product, $request);

        $this->products->delete($product);

        return response()->json(['deleted' => true]);
    }
}

