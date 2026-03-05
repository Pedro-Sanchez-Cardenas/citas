<?php

namespace App\Http\Controllers;

use App\Http\Requests\MoveAppointmentRequest;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\StoreTimeBlockRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Models\Appointment;
use App\Models\TimeBlock;
use App\Services\AppointmentService;
use App\Services\CalendarService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgendaController extends Controller
{
    public function __construct(
        protected CalendarService $calendarService,
        protected AppointmentService $appointmentService
    ) {
    }

    public function day(Request $request): JsonResponse
    {
        $date = $request->query('date')
            ? new CarbonImmutable($request->query('date'))
            : CarbonImmutable::now();

        $branchId = $request->query('branch_id') ? (int) $request->query('branch_id') : null;
        $professionalId = $request->query('professional_id') ? (int) $request->query('professional_id') : null;

        $data = $this->calendarService->getDayView($date, $branchId, $professionalId);

        return response()->json($data);
    }

    public function week(Request $request): JsonResponse
    {
        $start = $request->query('start')
            ? new CarbonImmutable($request->query('start'))
            : CarbonImmutable::now()->startOfWeek();

        $branchId = $request->query('branch_id') ? (int) $request->query('branch_id') : null;
        $professionalId = $request->query('professional_id') ? (int) $request->query('professional_id') : null;

        $data = $this->calendarService->getWeekView($start, $branchId, $professionalId);

        return response()->json($data);
    }

    public function storeAppointment(StoreAppointmentRequest $request): JsonResponse
    {
        $appointment = $this->appointmentService->create($request->validated());

        return response()->json($appointment, 201);
    }

    public function updateAppointment(UpdateAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        $updated = $this->appointmentService->update($appointment, $request->validated());

        return response()->json($updated);
    }

    /**
     * Endpoint pensado para drag & drop de citas en el calendario.
     */
    public function moveAppointment(MoveAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        $data = $request->validated();

        $start = new CarbonImmutable($data['start_at']);
        $end = new CarbonImmutable($data['end_at']);
        $branchId = $data['branch_id'] ?? null;
        $professionalId = $data['professional_id'] ?? null;

        $updated = $this->appointmentService->move($appointment, $start, $end, $branchId, $professionalId);

        return response()->json($updated);
    }

    public function storeBlock(StoreTimeBlockRequest $request): JsonResponse
    {
        $block = TimeBlock::create($request->validated());

        return response()->json($block, 201);
    }

    public function destroyBlock(TimeBlock $block): JsonResponse
    {
        $block->delete();

        return response()->json(['deleted' => true]);
    }
}

