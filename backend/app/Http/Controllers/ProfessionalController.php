<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\InteractsWithBusiness;
use App\Http\Requests\StoreProfessionalRequest;
use App\Http\Requests\UpdateProfessionalRequest;
use App\Models\Professional;
use App\Services\ProfessionalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfessionalController extends Controller
{
    use InteractsWithBusiness;

    public function __construct(
        protected ProfessionalService $professionalService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $branchId = $request->query('branch_id') ? (int) $request->query('branch_id') : null;
        $professionals = $this->professionalService->listForBusiness($businessId, $branchId);

        return response()->json($professionals);
    }

    public function store(StoreProfessionalRequest $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $data = $request->validated();
        $photo = $data['photo'] ?? $request->file('photo');
        unset($data['photo']);

        $professional = $this->professionalService->createForBusiness($businessId, $data);

        if ($photo) {
            $path = $photo->store(
                sprintf('professionals/%s/%s', $businessId, $professional->id),
                'public'
            );
            $professional->update(['photo_path' => $path]);
            $professional->refresh();
        }

        return response()->json($professional, 201);
    }

    public function show(Request $request, Professional $professional): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        $this->assertModelBelongsToRequestBusiness($professional, $request);

        return response()->json($professional);
    }

    public function update(UpdateProfessionalRequest $request, Professional $professional): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        $this->assertModelBelongsToRequestBusiness($professional, $request);

        $data = $request->validated();
        $photo = $data['photo'] ?? $request->file('photo');
        unset($data['photo']);

        if ($photo) {
            $dir = sprintf('professionals/%s/%s', $businessId, $professional->id);
            if ($professional->photo_path) {
                Storage::disk('public')->delete($professional->photo_path);
            }
            $path = $photo->store($dir, 'public');
            $data['photo_path'] = $path;
        }

        $updated = $this->professionalService->update($professional, $data);

        return response()->json($updated);
    }

    public function destroy(Request $request, Professional $professional): JsonResponse
    {
        $user = $request->user();
        if (! $user?->hasPermissionTo('manage_professionals')) {
            abort(403, 'No autorizado');
        }

        $businessId = (int) $request->user()->business_id;

        $this->assertModelBelongsToRequestBusiness($professional, $request);

        $this->professionalService->delete($professional);

        return response()->json(['deleted' => true]);
    }
}

