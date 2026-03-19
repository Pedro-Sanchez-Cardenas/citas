<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\InteractsWithBusiness;
use App\Http\Requests\MoveAppointmentRequest;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Models\Appointment;
use App\Models\Professional;
use App\Services\AppointmentService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AppointmentController extends Controller
{
    use InteractsWithBusiness;

    public function __construct(
        protected AppointmentService $appointmentService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Appointment::query()
            ->where('business_id', $request->user()->business_id)
            ->with(['branch', 'professional', 'service', 'combinedService', 'client']);

        $user = $request->user();
        if ($user?->hasRole('worker')) {
            $workerProfessionalId = (int) ($user->professional_id ?? 0);
            $workerBranchId = (int) (Professional::query()
                ->whereKey($workerProfessionalId)
                ->value('branch_id') ?? 0);

            if ($workerProfessionalId <= 0 || $workerBranchId <= 0) {
                abort(403, 'Usuario worker sin profesional asignado.');
            }

            // El worker solo puede ver en su misma sucursal.
            $query->where('branch_id', $workerBranchId);

            $professionalId = $request->query('professional_id');
            if ($professionalId !== null && $professionalId !== '') {
                if ((int) $professionalId !== $workerProfessionalId) {
                    abort(403, 'No autorizado para ver citas de otro profesional.');
                }
                $query->where('professional_id', $workerProfessionalId);
            }
        } else {
            if ($branchId = $request->query('branch_id')) {
                $query->where('branch_id', (int) $branchId);
            }

            if ($professionalId = $request->query('professional_id')) {
                $query->where('professional_id', (int) $professionalId);
            }
        }

        $appointments = $query
            ->orderBy('start_at')
            ->paginate(50);

        return response()->json($appointments);
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();
        if ($user?->hasRole('worker')) {
            $workerProfessionalId = (int) ($user->professional_id ?? 0);
            $workerBranchId = (int) (Professional::query()
                ->whereKey($workerProfessionalId)
                ->value('branch_id') ?? 0);

            if ($workerProfessionalId <= 0 || $workerBranchId <= 0) {
                abort(403, 'Usuario worker sin profesional asignado.');
            }

            $targetProfessionalId = (int) $data['professional_id'];
            // El worker puede crear citas para cualquier profesional del MISMO branch.
            $targetProfessional = Professional::query()
                ->whereKey($targetProfessionalId)
                ->where('branch_id', $workerBranchId)
                ->first();

            if (! $targetProfessional) {
                abort(403, 'No autorizado para crear citas para un profesional fuera de tu sucursal.');
            }

            if ((int) $data['branch_id'] !== $workerBranchId) {
                abort(403, 'No autorizado para crear citas en otra sucursal.');
            }
        }

        $data['business_id'] = (int) $request->user()->business_id;
        $appointment = $this->appointmentService->create($data);

        return response()->json($appointment, 201);
    }

    public function show(Request $request, Appointment $appointment): JsonResponse
    {
        $this->assertModelBelongsToRequestBusiness($appointment, $request);

        $user = $request->user();
        if ($user?->hasRole('worker')) {
            $workerProfessionalId = (int) ($user->professional_id ?? 0);
            $workerBranchId = (int) (Professional::query()
                ->whereKey($workerProfessionalId)
                ->value('branch_id') ?? 0);

            if ($workerProfessionalId <= 0 || $workerBranchId <= 0) {
                abort(403, 'Usuario worker sin profesional asignado.');
            }

            // El worker solo puede ver citas dentro de su sucursal.
            if ((int) $appointment->branch_id !== $workerBranchId) {
                abort(404);
            }
        }

        return response()->json(
            $appointment->load(['branch', 'professional', 'service', 'combinedService', 'client'])
        );
    }

    public function update(UpdateAppointmentRequest $request, Appointment $appointment): JsonResponse
    {
        $this->assertModelBelongsToRequestBusiness($appointment, $request);

        $data = $request->validated();
        $user = $request->user();
        if ($user?->hasRole('worker')) {
            $workerProfessionalId = (int) ($user->professional_id ?? 0);
            $workerBranchId = (int) (Professional::query()
                ->whereKey($workerProfessionalId)
                ->value('branch_id') ?? 0);

            if ($workerProfessionalId <= 0 || $workerBranchId <= 0) {
                abort(403, 'Usuario worker sin profesional asignado.');
            }

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
            $workerProfessionalId = (int) ($user->professional_id ?? 0);
            if ($workerProfessionalId <= 0 || (int) $appointment->professional_id !== $workerProfessionalId) {
                abort(403, 'No autorizado para eliminar una cita de otro profesional.');
            }
        }

        $appointment->delete();

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
            $workerProfessionalId = (int) ($user->professional_id ?? 0);
            $workerBranchId = (int) (Professional::query()
                ->whereKey($workerProfessionalId)
                ->value('branch_id') ?? 0);

            if ($workerProfessionalId <= 0 || $workerBranchId <= 0) {
                abort(403, 'Usuario worker sin profesional asignado.');
            }

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

