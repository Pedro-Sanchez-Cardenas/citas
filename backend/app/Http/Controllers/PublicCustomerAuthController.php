<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Branch;
use App\Models\Business;
use App\Models\Client;
use App\Models\ClientAccount;
use App\Models\Professional;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpKernel\Exception\HttpException;

class PublicCustomerAuthController extends Controller
{
    protected function findBusinessOrFail(string $slug): Business
    {
        return Business::query()->where('slug', $slug)->firstOrFail();
    }

    protected function ensureBusinessMatch(ClientAccount $account, Business $business): void
    {
        if ((int) $account->business_id !== (int) $business->id) {
            throw new HttpException(403, 'Acceso no permitido para este negocio.');
        }
    }

    public function register(string $businessSlug, Request $request): JsonResponse
    {
        $business = $this->findBusinessOrFail($businessSlug);
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

        $client = Client::query()
            ->where('business_id', $business->id)
            ->where('email', $validated['email'])
            ->first();

        if (! $client) {
            $client = Client::create([
                'business_id' => $business->id,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
            ]);
        } else {
            $client->update([
                'name' => $validated['name'],
                'phone' => $validated['phone'] ?? $client->phone,
            ]);
        }

        $account = ClientAccount::create([
            'business_id' => $business->id,
            'client_id' => $client->id,
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_active' => true,
        ]);

        Auth::guard('client')->login($account);
        $request->session()->regenerate();

        return response()->json([
            'account' => [
                'id' => $account->id,
                'email' => $account->email,
            ],
            'client' => $client->fresh(),
        ], 201);
    }

    public function login(string $businessSlug, Request $request): JsonResponse
    {
        $business = $this->findBusinessOrFail($businessSlug);
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        /** @var ClientAccount|null $account */
        $account = ClientAccount::query()
            ->where('business_id', $business->id)
            ->where('email', $validated['email'])
            ->first();

        if (! $account || ! $account->is_active || ! Hash::check($validated['password'], $account->password)) {
            return response()->json(['message' => 'Credenciales inválidas'], 401);
        }

        Auth::guard('client')->login($account);
        $request->session()->regenerate();
        $account->update(['last_login_at' => now()]);

        return response()->json([
            'account' => [
                'id' => $account->id,
                'email' => $account->email,
            ],
            'client' => $account->client()->first(),
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
        $business = $this->findBusinessOrFail($businessSlug);
        /** @var ClientAccount $account */
        $account = Auth::guard('client')->user();
        $this->ensureBusinessMatch($account, $business);

        return response()->json([
            'account' => [
                'id' => $account->id,
                'email' => $account->email,
            ],
            'client' => $account->client()->first(),
        ]);
    }

    public function appointments(string $businessSlug): JsonResponse
    {
        $business = $this->findBusinessOrFail($businessSlug);
        /** @var ClientAccount $account */
        $account = Auth::guard('client')->user();
        $this->ensureBusinessMatch($account, $business);

        $appointments = Appointment::query()
            ->where('business_id', $business->id)
            ->where('client_id', $account->client_id)
            ->with(['branch:id,name', 'professional:id,name', 'service:id,name', 'combinedService:id,name'])
            ->orderByDesc('start_at')
            ->get();

        return response()->json(['data' => $appointments]);
    }

    public function book(string $businessSlug, Request $request): JsonResponse
    {
        $business = $this->findBusinessOrFail($businessSlug);
        /** @var ClientAccount $account */
        $account = Auth::guard('client')->user();
        $this->ensureBusinessMatch($account, $business);

        $validated = $request->validate([
            'branch_id' => ['required', 'integer', Rule::exists('branches', 'id')],
            'professional_id' => ['required', 'integer', Rule::exists('professionals', 'id')],
            'service_id' => ['nullable', 'integer', Rule::exists('services', 'id')],
            'combined_service_id' => ['nullable', 'integer', Rule::exists('combined_services', 'id')],
            'start_at' => ['required', 'date'],
            'end_at' => ['required', 'date', 'after:start_at'],
            'notes' => ['nullable', 'string'],
        ]);

        $validBranch = Branch::query()
            ->whereKey($validated['branch_id'])
            ->where('business_id', $business->id)
            ->exists();
        $validProfessional = Professional::query()
            ->whereKey($validated['professional_id'])
            ->where('business_id', $business->id)
            ->exists();

        if (! $validBranch || ! $validProfessional) {
            return response()->json(['message' => 'Sucursal o profesional no válido para este negocio.'], 422);
        }

        $appointment = Appointment::create([
            'business_id' => $business->id,
            'branch_id' => $validated['branch_id'],
            'professional_id' => $validated['professional_id'],
            'service_id' => $validated['service_id'] ?? null,
            'combined_service_id' => $validated['combined_service_id'] ?? null,
            'client_id' => $account->client_id,
            'start_at' => $validated['start_at'],
            'end_at' => $validated['end_at'],
            'status' => 'scheduled',
            'source' => 'online_customer',
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json(['data' => $appointment->load(['branch', 'professional', 'service'])], 201);
    }
}

