<?php

namespace App\Http\Controllers;

use App\Http\Requests\PublicBookAppointmentRequest;
use App\Models\Business;
use App\Models\Branch;
use App\Models\Client;
use App\Models\Professional;
use App\Services\AppointmentService;
use App\Services\CalendarService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicBookingController extends Controller
{
    public function __construct(
        protected CalendarService $calendarService,
        protected AppointmentService $appointmentService
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

    public function book(string $businessSlug, PublicBookAppointmentRequest $request): JsonResponse
    {
        $business = $this->findBusinessOrFail($businessSlug);
        $validated = $request->validated();

        $client = null;
        if (! empty($validated['client_email'])) {
            $client = Client::query()
                ->where('business_id', $business->id)
                ->where('email', $validated['client_email'])
                ->first();
        }

        if (! $client) {
            $client = Client::create([
                'business_id' => $business->id,
                'branch_id' => $validated['branch_id'] ?? null,
                'name' => $validated['client_name'],
                'email' => $validated['client_email'] ?? null,
                'phone' => $validated['client_phone'] ?? null,
            ]);
        }

        $data = [
            'business_id' => $business->id,
            'branch_id' => $validated['branch_id'],
            'professional_id' => $validated['professional_id'],
            'service_id' => $validated['service_id'] ?? null,
            'combined_service_id' => $validated['combined_service_id'] ?? null,
            'client_id' => $client->id,
            'start_at' => $validated['start_at'],
            'end_at' => $validated['end_at'],
            'status' => $validated['status'] ?? 'scheduled',
            'source' => $validated['source'] ?? 'online',
            'notes' => $validated['notes'] ?? null,
        ];

        $appointment = $this->appointmentService->create($data);

        return response()->json($appointment, 201);
    }
}

