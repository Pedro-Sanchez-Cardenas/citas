<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Business;
use App\Models\TimeBlock;
use App\Models\WorkingHour;
use App\Repositories\Contracts\AppointmentRepositoryInterface;
use App\Services\InventoryService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Arr;
use Illuminate\Validation\ValidationException;

class AppointmentService
{
    public function __construct(
        protected AppointmentRepositoryInterface $appointmentRepository,
        protected InventoryService $inventoryService
    ) {
    }

    public function create(array $data): Appointment
    {
        $start = new CarbonImmutable($data['start_at']);
        $end = new CarbonImmutable($data['end_at']);

        $this->assertIntervalIsValid(
            $start,
            $end,
            $data['branch_id'],
            $data['professional_id'],
            null,
            (int) ($data['buffer_before_minutes'] ?? 0),
            (int) ($data['buffer_after_minutes'] ?? 0),
            (bool) ($data['overbooking_allowed'] ?? false),
            $this->resolveMaxOverlapsForBusiness((int) $data['business_id'])
        );

        // Confirmación automática según configuración del negocio si no se envía explícitamente
        if (! isset($data['status'])) {
            $autoConfirm = true;
            if (! empty($data['business_id'])) {
                $business = Business::find($data['business_id']);
                $autoConfirm = (bool) Arr::get($business?->settings ?? [], 'auto_confirm_appointments', true);
            }

            $data['status'] = $autoConfirm ? 'confirmed' : 'scheduled';
        }

        return $this->appointmentRepository->create($data);
    }

    public function update(Appointment $appointment, array $data): Appointment
    {
        $previousStatus = $appointment->status;
        $merged = array_merge($appointment->toArray(), $data);

        $start = new CarbonImmutable($merged['start_at']);
        $end = new CarbonImmutable($merged['end_at']);

        $this->assertIntervalIsValid(
            $start,
            $end,
            $merged['branch_id'],
            $merged['professional_id'],
            $appointment->id,
            (int) ($merged['buffer_before_minutes'] ?? 0),
            (int) ($merged['buffer_after_minutes'] ?? 0),
            (bool) ($merged['overbooking_allowed'] ?? false),
            $this->resolveMaxOverlapsForBusiness((int) $merged['business_id'])
        );

        $updated = $this->appointmentRepository->update($appointment, $data);

        $this->consumeInventoryOnStatusChange($updated, $previousStatus);

        return $updated;
    }

    /**
     * Mover una cita (drag & drop) a un nuevo horario/profesional/sucursal.
     */
    public function move(Appointment $appointment, CarbonImmutable $newStart, CarbonImmutable $newEnd, ?int $branchId = null, ?int $professionalId = null): Appointment
    {
        $branchId ??= $appointment->branch_id;
        $professionalId ??= $appointment->professional_id;

        $this->assertIntervalIsValid(
            $newStart,
            $newEnd,
            $branchId,
            $professionalId,
            $appointment->id,
            (int) ($appointment->buffer_before_minutes ?? 0),
            (int) ($appointment->buffer_after_minutes ?? 0),
            (bool) ($appointment->overbooking_allowed ?? false),
            $this->resolveMaxOverlapsForBusiness((int) $appointment->business_id)
        );

        $previousStatus = $appointment->status;

        $updated = $this->appointmentRepository->update($appointment, [
            'branch_id' => $branchId,
            'professional_id' => $professionalId,
            'start_at' => $newStart,
            'end_at' => $newEnd,
        ]);

        $this->consumeInventoryOnStatusChange($updated, $previousStatus);

        return $updated;
    }

    protected function assertIntervalIsValid(
        CarbonImmutable $start,
        CarbonImmutable $end,
        int $branchId,
        int $professionalId,
        ?int $ignoreAppointmentId = null,
        int $bufferBeforeMinutes = 0,
        int $bufferAfterMinutes = 0,
        bool $allowOverbooking = false,
        int $maxOverlaps = 0
    ): void {
        if ($end->lessThanOrEqualTo($start)) {
            throw ValidationException::withMessages([
                'end_at' => 'La hora de fin debe ser posterior a la hora de inicio.',
            ]);
        }

        $slotStart = $start->subMinutes($bufferBeforeMinutes);
        $slotEnd = $end->addMinutes($bufferAfterMinutes);

        // Validar que el intervalo (incluyendo buffer) cae dentro de algún horario laboral activo
        $weekday = $start->dayOfWeekIso % 7; // 0-6 compatible con nuestro diseño (0 = domingo)

        $hasWorkingHour = WorkingHour::query()
            ->where('is_active', true)
            ->where('weekday', $weekday)
            ->where(function ($q) use ($branchId, $professionalId) {
                $q->whereNull('professional_id')
                    ->where('branch_id', $branchId)
                    ->orWhere(function ($q2) use ($branchId, $professionalId) {
                        $q2->where('branch_id', $branchId)
                            ->where('professional_id', $professionalId);
                    });
            })
            ->where(function ($q) use ($start) {
                $q->whereNull('effective_from')
                    ->orWhere('effective_from', '<=', $start->toDateString());
            })
            ->where(function ($q) use ($start) {
                $q->whereNull('effective_until')
                    ->orWhere('effective_until', '>=', $start->toDateString());
            })
            ->where('start_time', '<=', $slotStart->format('H:i:s'))
            ->where('end_time', '>=', $slotEnd->format('H:i:s'))
            ->exists();

        if (! $hasWorkingHour) {
            throw ValidationException::withMessages([
                'start_at' => 'La cita está fuera del horario laboral configurado.',
            ]);
        }

        // Validar que no cae en un bloqueo
        $hasBlock = TimeBlock::query()
            ->where(function ($q) use ($branchId, $professionalId) {
                $q->whereNull('professional_id')
                    ->where('branch_id', $branchId)
                    ->orWhere(function ($q2) use ($branchId, $professionalId) {
                        $q2->where('branch_id', $branchId)
                            ->where('professional_id', $professionalId);
                    });
            })
            ->where(function ($q) use ($slotStart, $slotEnd) {
                $q->whereBetween('start_at', [$slotStart, $slotEnd])
                    ->orWhereBetween('end_at', [$slotStart, $slotEnd])
                    ->orWhere(function ($q2) use ($slotStart, $slotEnd) {
                        $q2->where('start_at', '<=', $slotStart)
                            ->where('end_at', '>=', $slotEnd);
                    });
            })
            ->exists();

        if ($hasBlock) {
            throw ValidationException::withMessages([
                'start_at' => 'El horario seleccionado está bloqueado.',
            ]);
        }

        // Validar solapes con otras citas del mismo profesional (aplicando buffer)
        $overlapsCount = Appointment::query()
            ->where('branch_id', $branchId)
            ->where('professional_id', $professionalId)
            ->when($ignoreAppointmentId, fn ($q) => $q->whereKeyNot($ignoreAppointmentId))
            ->where(function ($q) use ($slotStart, $slotEnd) {
                $q->whereBetween('start_at', [$slotStart, $slotEnd])
                    ->orWhereBetween('end_at', [$slotStart, $slotEnd])
                    ->orWhere(function ($q2) use ($slotStart, $slotEnd) {
                        $q2->where('start_at', '<=', $slotStart)
                            ->where('end_at', '>=', $slotEnd);
                    });
            })
            ->count();

        if (! $allowOverbooking && $overlapsCount > 0) {
            throw ValidationException::withMessages([
                'start_at' => 'Hay otra cita en el mismo horario para este profesional.',
            ]);
        }

        if ($allowOverbooking && $maxOverlaps > 0 && $overlapsCount >= $maxOverlaps) {
            throw ValidationException::withMessages([
                'start_at' => 'Se alcanzó el límite de overbooking permitido para este horario.',
            ]);
        }
    }

    protected function resolveMaxOverlapsForBusiness(int $businessId): int
    {
        if (! $businessId) {
            return 1;
        }

        $business = Business::find($businessId);
        if (! $business) {
            return 1;
        }

        $max = (int) Arr::get($business->settings ?? [], 'max_overbooking_per_slot', 1);

        return $max < 1 ? 1 : $max;
    }

    protected function consumeInventoryOnStatusChange(Appointment $appointment, ?string $previousStatus): void
    {
        if ($previousStatus === 'attended' || $appointment->status !== 'attended') {
            return;
        }

        if (! $appointment->business_id || ! $appointment->branch_id) {
            return;
        }

        // Evitar consumo duplicado
        if (\App\Models\ProductMovement::query()
            ->where('appointment_id', $appointment->id)
            ->where('reason', 'appointment_consumption')
            ->exists()) {
            return;
        }

        $appointment->loadMissing([
            'service.products',
            'combinedService.items.service.products',
        ]);

        $materials = [];

        if ($appointment->service) {
            foreach ($appointment->service->products as $product) {
                $materials[$product->id] = ($materials[$product->id] ?? 0) + (float) $product->pivot->quantity;
            }
        }

        if ($appointment->combinedService) {
            foreach ($appointment->combinedService->items as $item) {
                if (! $item->service) {
                    continue;
                }

                foreach ($item->service->products as $product) {
                    $materials[$product->id] = ($materials[$product->id] ?? 0) + (float) $product->pivot->quantity;
                }
            }
        }

        if (empty($materials)) {
            return;
        }

        foreach ($materials as $productId => $quantity) {
            $product = \App\Models\Product::find($productId);
            if (! $product) {
                continue;
            }

            $this->inventoryService->adjustStock(
                (int) $appointment->business_id,
                (int) $appointment->branch_id,
                $product,
                $quantity,
                'out',
                'appointment_consumption',
                $appointment->id,
            );
        }
    }
}

