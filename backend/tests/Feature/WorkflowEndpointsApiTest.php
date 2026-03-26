<?php

namespace Tests\Feature;

use App\Models\Product;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Support\CreatesTenantData;
use Tests\TestCase;

class WorkflowEndpointsApiTest extends TestCase
{
    use RefreshDatabase;
    use CreatesTenantData;

    public function test_appointments_crud_and_move_flow(): void
    {
        $ctx = $this->authenticatedTenant();
        $business = $ctx['business'];
        $branch = $ctx['branch'];
        $professional = $this->createProfessional($business, $branch);
        $category = $this->createServiceCategory($business, $branch);
        $service = $this->createService($business, $branch, $category);
        $client = $this->createClient($business, $branch);
        $start = CarbonImmutable::now()->addDay()->setTime(10, 0);
        $end = $start->addMinutes(30);
        $this->createWorkingHour($business, $branch, $professional, $start);

        $created = $this->postJson('/api/appointments', [
            'branch_id' => $branch->id,
            'professional_id' => $professional->id,
            'service_id' => $service->id,
            'client_id' => $client->id,
            'start_at' => $start->toIso8601String(),
            'end_at' => $end->toIso8601String(),
            'status' => 'scheduled',
        ])->assertStatus(201)->json();

        $id = (int) $created['id'];

        $this->getJson('/api/appointments')->assertStatus(200);
        $this->getJson("/api/appointments/{$id}")->assertStatus(200);
        $this->putJson("/api/appointments/{$id}", ['status' => 'confirmed'])->assertStatus(200);
        $this->patchJson("/api/appointments/{$id}/move", [
            'start_at' => $start->addHour()->toIso8601String(),
            'end_at' => $end->addHour()->toIso8601String(),
        ])->assertStatus(200);
        $this->deleteJson("/api/appointments/{$id}")->assertStatus(200);
    }

    public function test_payments_endpoints_with_appointment_reference(): void
    {
        $ctx = $this->authenticatedTenant();
        $business = $ctx['business'];
        $branch = $ctx['branch'];
        $professional = $this->createProfessional($business, $branch);
        $service = $this->createService($business, $branch);
        $client = $this->createClient($business, $branch);
        $start = CarbonImmutable::now()->addDay()->setTime(9, 0);
        $this->createWorkingHour($business, $branch, $professional, $start);
        $appointment = $this->createAppointment($business, $branch, $professional, $service, $client, $start, $start->addMinutes(30));

        $created = $this->postJson('/api/payments', [
            'branch_id' => $branch->id,
            'appointment_id' => $appointment->id,
            'method' => 'cash',
            'amount_cents' => 3000,
            'status' => 'paid',
        ])->assertStatus(201)->json();

        $id = (int) $created['id'];

        $this->getJson('/api/payments')->assertStatus(200);
        $this->getJson("/api/payments/{$id}")->assertStatus(200);
    }

    public function test_inventory_adjust_and_stocks_endpoints(): void
    {
        $ctx = $this->authenticatedTenant();
        $business = $ctx['business'];
        $branch = $ctx['branch'];
        $product = Product::create([
            'business_id' => $business->id,
            'name' => 'Cera',
            'sku' => 'SKU-CERA-001',
            'cost_cents' => 400,
        ]);

        $this->postJson('/api/inventory/adjust', [
            'branch_id' => $branch->id,
            'product_id' => $product->id,
            'type' => 'in',
            'quantity' => 5,
            'reason' => 'stock inicial',
        ])->assertStatus(200);

        $this->getJson('/api/inventory/stocks?branch_id='.$branch->id)->assertStatus(200);
    }

    public function test_service_professionals_and_materials_sync_endpoints(): void
    {
        $ctx = $this->authenticatedTenant();
        $business = $ctx['business'];
        $branch = $ctx['branch'];
        $service = $this->createService($business, $branch);
        $professional = $this->createProfessional($business, $branch);
        $product = Product::create([
            'business_id' => $business->id,
            'name' => 'Gel',
            'sku' => 'SKU-GEL-001',
            'cost_cents' => 300,
        ]);

        $this->putJson("/api/services/{$service->id}/professionals", [
            'professional_ids' => [$professional->id],
        ])->assertStatus(200);

        $this->getJson("/api/services/{$service->id}/professionals")->assertStatus(200);

        $this->putJson("/api/services/{$service->id}/materials", [
            'materials' => [
                ['product_id' => $product->id, 'quantity' => 1.5],
            ],
        ])->assertStatus(200);

        $this->getJson("/api/services/{$service->id}/materials")->assertStatus(200);
    }

    public function test_client_media_endpoints(): void
    {
        $ctx = $this->authenticatedTenant();
        $business = $ctx['business'];
        $branch = $ctx['branch'];
        $client = $this->createClient($business, $branch);

        $created = $this->postJson("/api/clients/{$client->id}/media", [
            'type' => 'before',
            'photo_path' => 'https://example.com/before.jpg',
        ])->assertStatus(201)->json();

        $id = (int) $created['id'];

        $this->getJson("/api/clients/{$client->id}/media")->assertStatus(200);
        $this->deleteJson("/api/client-media/{$id}")->assertStatus(200);
    }
}
