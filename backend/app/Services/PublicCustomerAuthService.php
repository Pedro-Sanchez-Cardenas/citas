<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Business;
use App\Models\ClientAccount;
use App\Repositories\Contracts\AppointmentRepositoryInterface;
use App\Repositories\Contracts\BranchRepositoryInterface;
use App\Repositories\Contracts\BusinessRepositoryInterface;
use App\Repositories\Contracts\ClientAccountRepositoryInterface;
use App\Repositories\Contracts\ClientRepositoryInterface;
use App\Repositories\Contracts\ProfessionalRepositoryInterface;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpKernel\Exception\HttpException;

class PublicCustomerAuthService
{
    public function __construct(
        protected BusinessRepositoryInterface $businesses,
        protected ClientRepositoryInterface $clients,
        protected ClientAccountRepositoryInterface $clientAccounts,
        protected AppointmentRepositoryInterface $appointments,
        protected BranchRepositoryInterface $branches,
        protected ProfessionalRepositoryInterface $professionals
    ) {
    }

    public function ensureAccountMatchesBusiness(ClientAccount $account, int $businessId): void
    {
        if ((int) $account->business_id !== (int) $businessId) {
            throw new HttpException(403, 'Acceso no permitido para este negocio.');
        }
    }

    public function resolveBusinessOrFail(string $slug): Business
    {
        return $this->businesses->findBySlugOrFail($slug);
    }

    /**
     * @return array{account: ClientAccount, client: \App\Models\Client}
     */
    public function register(string $businessSlug, array $validated): array
    {
        $business = $this->businesses->findBySlugOrFail($businessSlug);

        $client = $this->clients->findByBusinessAndEmail($business->id, $validated['email']);

        if (! $client) {
            $client = $this->clients->createForBusiness($business->id, [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
            ]);
        } else {
            $client = $this->clients->update($client, [
                'name' => $validated['name'],
                'phone' => $validated['phone'] ?? $client->phone,
            ]);
        }

        $account = $this->clientAccounts->create([
            'business_id' => $business->id,
            'client_id' => $client->id,
            'email' => $validated['email'],
            'password' => $validated['password'],
            'is_active' => true,
        ]);

        $client = $this->clients->findForBusiness($business->id, $client->id);

        return ['account' => $account, 'client' => $client];
    }

    /**
     * @return array{account: ClientAccount, client: \App\Models\Client}|null
     */
    public function authenticate(string $businessSlug, array $validated): ?array
    {
        $business = $this->businesses->findBySlugOrFail($businessSlug);

        $account = $this->clientAccounts->findByBusinessAndEmail($business->id, $validated['email']);

        if (! $account || ! $account->is_active || ! Hash::check($validated['password'], $account->password)) {
            return null;
        }

        $this->clientAccounts->updateLastLoginAt($account);

        $client = $this->clients->findForBusiness($business->id, $account->client_id);

        return ['account' => $account, 'client' => $client];
    }

    /**
     * @return array{account: ClientAccount, client: \App\Models\Client|null}
     */
    public function getProfile(string $businessSlug, ClientAccount $account): array
    {
        $business = $this->businesses->findBySlugOrFail($businessSlug);
        $this->ensureAccountMatchesBusiness($account, $business->id);

        $client = $this->clients->findForBusiness($business->id, $account->client_id);

        return ['account' => $account, 'client' => $client];
    }

    public function listAppointments(string $businessSlug, ClientAccount $account): Collection
    {
        $business = $this->businesses->findBySlugOrFail($businessSlug);
        $this->ensureAccountMatchesBusiness($account, $business->id);

        return $this->appointments->listForClientInBusiness($business->id, $account->client_id);
    }

    public function bookAppointment(string $businessSlug, ClientAccount $account, array $validated): Appointment
    {
        $business = $this->businesses->findBySlugOrFail($businessSlug);
        $this->ensureAccountMatchesBusiness($account, $business->id);

        $branchOk = $this->branches->existsForBusiness($validated['branch_id'], $business->id);
        $professionalOk = (bool) $this->professionals->findForBusiness($business->id, $validated['professional_id']);

        if (! $branchOk || ! $professionalOk) {
            throw new HttpResponseException(response()->json([
                'message' => 'Sucursal o profesional no válido para este negocio.',
            ], 422));
        }

        $appointment = $this->appointments->create([
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

        return $this->appointments->loadPublicBookingRelations($appointment);
    }
}
