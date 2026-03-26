<?php

namespace App\Http\Controllers;

use App\Models\ClientAccount;
use App\Services\PublicCustomerAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class PublicCustomerAuthController extends Controller
{
    public function __construct(
        protected PublicCustomerAuthService $publicCustomerAuthService
    ) {
    }

    public function register(string $businessSlug, Request $request): JsonResponse
    {
        $business = $this->publicCustomerAuthService->resolveBusinessOrFail($businessSlug);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('client_accounts', 'email')->where(
                    fn ($q) => $q->where('business_id', $business->id)
                ),
            ],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        $result = $this->publicCustomerAuthService->register($businessSlug, $validated);

        Auth::guard('client')->login($result['account']);
        $request->session()->regenerate();

        return response()->json([
            'account' => [
                'id' => $result['account']->id,
                'email' => $result['account']->email,
            ],
            'client' => $result['client'],
        ], 201);
    }

    public function login(string $businessSlug, Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $result = $this->publicCustomerAuthService->authenticate($businessSlug, $validated);

        if (! $result) {
            return response()->json(['message' => 'Credenciales inválidas'], 401);
        }

        Auth::guard('client')->login($result['account']);
        $request->session()->regenerate();

        return response()->json([
            'account' => [
                'id' => $result['account']->id,
                'email' => $result['account']->email,
            ],
            'client' => $result['client'],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('client')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sesión de cliente cerrada']);
    }

    public function me(string $businessSlug): JsonResponse
    {
        /** @var ClientAccount $account */
        $account = Auth::guard('client')->user();

        $result = $this->publicCustomerAuthService->getProfile($businessSlug, $account);

        return response()->json([
            'account' => [
                'id' => $result['account']->id,
                'email' => $result['account']->email,
            ],
            'client' => $result['client'],
        ]);
    }

    public function appointments(string $businessSlug): JsonResponse
    {
        /** @var ClientAccount $account */
        $account = Auth::guard('client')->user();

        $appointments = $this->publicCustomerAuthService->listAppointments($businessSlug, $account);

        return response()->json(['data' => $appointments]);
    }

    public function book(string $businessSlug, Request $request): JsonResponse
    {
        /** @var ClientAccount $account */
        $account = Auth::guard('client')->user();

        $validated = $request->validate([
            'branch_id' => ['required', 'integer', Rule::exists('branches', 'id')],
            'professional_id' => ['required', 'integer', Rule::exists('professionals', 'id')],
            'service_id' => ['nullable', 'integer', Rule::exists('services', 'id')],
            'combined_service_id' => ['nullable', 'integer', Rule::exists('combined_services', 'id')],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after:start_at'],
            'notes' => ['nullable', 'string'],
        ]);

        $appointment = $this->publicCustomerAuthService->bookAppointment($businessSlug, $account, $validated);

        return response()->json(['data' => $appointment], 201);
    }
}
