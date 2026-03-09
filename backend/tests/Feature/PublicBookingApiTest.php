<?php

namespace Tests\Feature;

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

        $date = CarbonImmutable::now()->addDay()->setTime(10, 0);
        $this->createWorkingHour($business, $branch, $professional, $date);

        $this->getJson('/api/public/negocio-publico/services')->assertStatus(200);
        $this->getJson('/api/public/negocio-publico/professionals')->assertStatus(200);
        $this->getJson('/api/public/negocio-publico/availability?date='.$date->toDateString().'&branch_id='.$branch->id)->assertStatus(200);

        $this->postJson('/api/public/negocio-publico/book', [
            'branch_id' => $branch->id,
            'professional_id' => $professional->id,
            'service_id' => $service->id,
            'client_name' => 'Cliente Web',
            'client_email' => 'cliente-web@example.com',
            'start_at' => $date->toIso8601String(),
            'end_at' => $date->addMinutes(30)->toIso8601String(),
            'status' => 'scheduled',
            'source' => 'online',
        ])->assertStatus(201);
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
