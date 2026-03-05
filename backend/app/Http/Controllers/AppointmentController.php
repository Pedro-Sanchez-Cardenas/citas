<?php

namespace App\Http\Controllers;

use App\Http\Requests\MoveAppointmentRequest;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Models\Appointment;
use App\Services\AppointmentService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    public function __construct(
        protected AppointmentService $appointmentService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Appointment::query()
            ->where('business_id', $request->user()->business_id)
            ->with(['branch', 'professional', 'service', 'combinedService', 'client']);

        if ($branchId = $request->query('branch_id')) {
            $query->where('branch_id', (int) $branchId);
        }

        if ($professionalId = $request->query('professional_id')) {
            $query->where('professional_id', (int) $professionalId);
        }

        $appointments = $query
            ->orderBy('start_at')
            ->paginate(50);

        return response()->json($appointments);
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $appointment = $this->appointmentService->create($request->validated());

        return response()->json($appointment, 201);
    }

    public function show(Request $request, Appointment $appointment): JsonResponse
    {
        if ((int) $appointment->business_id !== (int) $request->user()->business_id) {
            abort(404);
        }

        return response()->json(
            $appointment->load(['branch', 'professional', 'service', 'combinedService', 'client'])
        );
    }

    public function update(UpdateAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        if ((int) $appointment->business_id !== (int) $request->user()->business_id) {
            abort(404);
        }

        $updated = $this->appointmentService->update($appointment, $request->validated());

        return response()->json($updated);
    }

    public function destroy(Request $request, Appointment $appointment): JsonResponse
    {
        if ((int) $appointment->business_id !== (int) $request->user()->business_id) {
            abort(404);
        }

        $appointment->delete();

        return response()->json(['deleted' => true]);
    }

    /**
     * Endpoint pensado para drag & drop de citas en el calendario.
     */
    public function move(MoveAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        if ((int) $appointment->business_id !== (int) $request->user()->business_id) {
            abort(404);
        }

        $data = $request->validated();

        $start = new CarbonImmutable($data['start_at']);
        $end = new CarbonImmutable($data['end_at']);
        $branchId = $data['branch_id'] ?? null;
        $professionalId = $data['professional_id'] ?? null;

        $updated = $this->appointmentService->move($appointment, $start, $end, $branchId, $professionalId);

        return response()->json($updated);
    }
}

