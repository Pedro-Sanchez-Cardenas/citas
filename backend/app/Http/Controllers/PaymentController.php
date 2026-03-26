<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaymentRequest;
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

        if (! empty($data['appointment_id'])) {
            $payment = $this->paymentService->registerAppointmentPaymentWithAppointment(
                $businessId,
                (int) $data['appointment_id'],
                $data
            );
        } else {
            $payment = $this->paymentService->createForBusiness($businessId, $data);
        }

        return response()->json($payment, 201);
    }

    public function show(Request $request, Payment $payment): JsonResponse
    {
        $businessId = (int) $request->user()->business_id;

        $payment = $this->paymentService->findForBusinessOrFail($businessId, $payment->id);

        return response()->json($payment);
    }
}
