<?php

namespace Tests\Feature;

use App\Models\ClientAccount;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Support\CreatesTenantData;
use Tests\TestCase;

class PublicBookingApiTest extends TestCase
{
    use RefreshDatabase;
    use CreatesTenantData;

    public function test_public_booking_endpoints_return_data_for_valid_slug(): void
    {
        $business = $this->createBusiness([
            'name' => 'Negocio Publico',
            'slug' => 'negocio-publico',
            'owner_name' => 'Owner Publico',
            'owner_email' => 'owner-publico@example.com',
        ]);
        $branch = $this->createBranch($business);
        $professional = $this->createProfessional($business, $branch);
        $service = $this->createService($business, $branch);

        $start = CarbonImmutable::now()->addDay()->setTime(10, 0);
        $end = $start->addMinutes(30);
        $this->createWorkingHour($business, $branch, $professional, $start);

        $this->getJson('/api/public/negocio-publico/services')->assertStatus(200);
        $this->getJson('/api/public/negocio-publico/professionals')->assertStatus(200);
        $this->getJson('/api/public/negocio-publico/availability?date='.$start->toDateString().'&branch_id='.$branch->id)->assertStatus(200);

        $client = $this->createClient($business, $branch, [
            'email' => 'cliente-web@example.com',
            'name' => 'Cliente Web',
        ]);
        $account = ClientAccount::create([
            'business_id' => $business->id,
            'client_id' => $client->id,
            'email' => 'cliente-web@example.com',
            'password' => 'password123',
            'is_active' => true,
        ]);

        $this->actingAs($account, 'client')
            ->postJson('/api/public/negocio-publico/customer/book', [
                'branch_id' => $branch->id,
                'professional_id' => $professional->id,
                'service_id' => $service->id,
                'start_at' => $start->toIso8601String(),
                'end_at' => $end->toIso8601String(),
            ])
            ->assertStatus(201)
            ->assertJsonStructure(['data']);
    }

    public function test_public_availability_returns_404_for_branch_from_other_business(): void
    {
        $businessA = $this->createBusiness(['slug' => 'negocio-a']);
        $this->createBranch($businessA, ['code' => 'A-0001']);

        $businessB = $this->createBusiness(['slug' => 'negocio-b']);
        $branchB = $this->createBranch($businessB, ['code' => 'B-0001']);

        $this->getJson('/api/public/negocio-a/availability?branch_id='.$branchB->id)
            ->assertStatus(404);
    }
}
