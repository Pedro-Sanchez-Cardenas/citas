<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\Branch;
use App\Models\Professional;
use App\Services\CalendarService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicBookingController extends Controller
{
    public function __construct(
        protected CalendarService $calendarService
    ) {
    }

    protected function findBusinessOrFail(string $slug): Business
    {
        return Business::where('slug', $slug)->firstOrFail();
    }

    public function services(string $businessSlug, Request $request): JsonResponse
    {
        $business = $this->findBusinessOrFail($businessSlug);

        $services = $business->branches()
            ->with(['services' => function ($q) {
                $q->where('is_active', true);
            }])
            ->get();

        return response()->json($services);
    }

    public function professionals(string $businessSlug, Request $request): JsonResponse
    {
        $business = $this->findBusinessOrFail($businessSlug);

        $professionals = Professional::query()
            ->where('business_id', $business->id)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'branch_id']);

        return response()->json($professionals);
    }

    public function availability(string $businessSlug, Request $request): JsonResponse
    {
        $business = $this->findBusinessOrFail($businessSlug);

        $date = $request->query('date')
            ? new CarbonImmutable($request->query('date'))
            : CarbonImmutable::now();

        $branchId = $request->query('branch_id') ? (int) $request->query('branch_id') : null;
        $professionalId = $request->query('professional_id') ? (int) $request->query('professional_id') : null;

        if ($branchId) {
            $validBranch = Branch::query()
                ->whereKey($branchId)
                ->where('business_id', $business->id)
                ->exists();

            if (! $validBranch) {
                abort(404);
            }
        }

        if ($professionalId) {
            $validProfessional = Professional::query()
                ->whereKey($professionalId)
                ->where('business_id', $business->id)
                ->exists();

            if (! $validProfessional) {
                abort(404);
            }
        }

        // Reutilizamos la vista de día de la agenda
        $data = $this->calendarService->getDayView($business->id, $date, $branchId, $professionalId);

        return response()->json([
            'business' => $business,
            'calendar' => $data,
        ]);
    }

}

