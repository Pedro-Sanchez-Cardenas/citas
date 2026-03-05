<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Payment;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PaymentService
{
    public function __construct(
        protected PaymentRepositoryInterface $payments
    ) {
    }

    public function listForBusiness(int $businessId, ?int $branchId = null, int $perPage = 15): LengthAwarePaginator
    {
        return $this->payments->paginateForBusiness($businessId, $branchId, $perPage);
    }

    public function createForBusiness(int $businessId, array $data): Payment
    {
        return $this->payments->createForBusiness($businessId, $data);
    }

    public function registerAppointmentPayment(int $businessId, Appointment $appointment, array $data): Payment
    {
        $payload = array_merge($data, [
            'branch_id' => $appointment->branch_id,
            'appointment_id' => $appointment->id,
            'client_id' => $appointment->client_id,
        ]);

        return $this->payments->createForBusiness($businessId, $payload);
    }
}

