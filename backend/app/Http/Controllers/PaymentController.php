<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaymentRequest;
use App\Models\Appointment;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $branchId = $request->query('branch_id') ? (int) $request->query('branch_id') : null;
        $payments = $this->paymentService->listForBusiness($businessId, $branchId);

        return response()->json($payments);
    }

    public function store(StorePaymentRequest $request): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;
        $data = $request->validated();

        // Si se asocia a una cita, usamos el helper específico
        if (! empty($data['appointment_id'])) {
            $appointment = Appointment::findOrFail($data['appointment_id']);
            if ($appointment->business_id !== $businessId) {
                abort(404);
            }

            $payment = $this->paymentService->registerAppointmentPayment($businessId, $appointment, $data);
        } else {
            $payment = $this->paymentService->createForBusiness($businessId, $data);
        }

        return response()->json($payment, 201);
    }

    public function show(Request $request, Payment $payment): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        if ($payment->business_id !== $businessId) {
            abort(404);
        }

        return response()->json($payment);
    }
}

