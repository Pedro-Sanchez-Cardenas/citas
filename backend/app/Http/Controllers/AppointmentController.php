<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\InteractsWithBusiness;
use App\Http\Requests\MoveAppointmentRequest;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Models\Appointment;
use App\Services\AppointmentService;
use App\Services\ProfessionalService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    use InteractsWithBusiness;

    public function __construct(
        protected AppointmentService $appointmentService,
        protected ProfessionalService $professionalService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $appointments = $this->appointmentService->paginateForPanel($request);

        return response()->json($appointments);
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();
        $businessId = (int) $request->user()->business_id;

        if ($user?->hasRole('worker')) {
            $this->appointmentService->assertWorkerCanCreateAppointment(
                $businessId,
                $user->professional_id,
                $data
            );
        }

        $data['business_id'] = $businessId;
        $appointment = $this->appointmentService->create($data);

        return response()->json($appointment, 201);
    }

    public function show(Request $request, Appointment $appointment): JsonResponse
    {
        $this->assertModelBelongsToRequestBusiness($appointment, $request);

        $user = $request->user();
        if ($user?->hasRole('worker')) {
            [, $workerBranchId] = $this->professionalService->requireWorkerBranchContext(
                (int) $request->user()->business_id,
                $user->professional_id
            );

            if ((int) $appointment->branch_id !== $workerBranchId) {
                abort(404);
            }
        }

        return response()->json(
            $this->appointmentService->showWithRelations($appointment)
        );
    }

    public function update(UpdateAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        $this->assertModelBelongsToRequestBusiness($appointment, $request);

        $data = $request->validated();
        $user = $request->user();
        if ($user?->hasRole('worker')) {
            [$workerProfessionalId, $workerBranchId] = $this->professionalService->requireWorkerBranchContext(
                (int) $request->user()->business_id,
                $user->professional_id
            );

            if ((int) $appointment->professional_id !== $workerProfessionalId) {
                abort(403, 'No autorizado para actualizar una cita de otro profesional.');
            }

            if (array_key_exists('professional_id', $data) && $data['professional_id'] !== null) {
                if ((int) $data['professional_id'] !== $workerProfessionalId) {
                    abort(403, 'No autorizado para reasignar el profesional de una cita.');
                }
            }

            if (array_key_exists('branch_id', $data) && $data['branch_id'] !== null) {
                if ((int) $data['branch_id'] !== $workerBranchId) {
                    abort(403, 'No autorizado para mover una cita a otra sucursal.');
                }
            }
        }

        $updated = $this->appointmentService->update($appointment, $data);

        return response()->json($updated);
    }

    public function destroy(Request $request, Appointment $appointment): JsonResponse
    {
        $this->assertModelBelongsToRequestBusiness($appointment, $request);

        $user = $request->user();
        if ($user?->hasRole('worker')) {
            [$workerProfessionalId] = $this->professionalService->requireWorkerBranchContext(
                (int) $request->user()->business_id,
                $user->professional_id
            );

            if ((int) $appointment->professional_id !== $workerProfessionalId) {
                abort(403, 'No autorizado para eliminar una cita de otro profesional.');
            }
        }

        $this->appointmentService->deleteForBusiness($appointment);

        return response()->json(['deleted' => true]);
    }

    /**
     * Endpoint pensado para drag & drop de citas en el calendario.
     */
    public function move(MoveAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        $this->assertModelBelongsToRequestBusiness($appointment, $request);

        $data = $request->validated();

        $start = new CarbonImmutable($data['start_at']);
        $end = new CarbonImmutable($data['end_at']);
        $branchId = $data['branch_id'] ?? null;
        $professionalId = $data['professional_id'] ?? null;

        $user = $request->user();
        if ($user?->hasRole('worker')) {
            [$workerProfessionalId, $workerBranchId] = $this->professionalService->requireWorkerBranchContext(
                (int) $request->user()->business_id,
                $user->professional_id
            );

            if ((int) $appointment->professional_id !== $workerProfessionalId) {
                abort(403, 'No autorizado para mover una cita de otro profesional.');
            }

            if ($professionalId !== null && (int) $professionalId !== $workerProfessionalId) {
                abort(403, 'No autorizado para reasignar el profesional de una cita.');
            }

            if ($branchId !== null && (int) $branchId !== $workerBranchId) {
                abort(403, 'No autorizado para mover una cita a otra sucursal.');
            }
        }

        $updated = $this->appointmentService->move($appointment, $start, $end, $branchId, $professionalId);

        return response()->json($updated);
    }
}
