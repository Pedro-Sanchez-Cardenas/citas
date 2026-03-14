<?php

namespace Tests\Feature;

use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Support\CreatesTenantData;
use Tests\TestCase;

class ResourceCrudApiTest extends TestCase
{
    use RefreshDatabase;
    use CreatesTenantData;

    public function test_branches_endpoint_lists_only_current_business(): void
    {
        $ctx = $this->authenticatedTenant();
        $business = $ctx['business'];
        $ownBranch = $ctx['branch'];

        $otherBusiness = $this->createBusiness(['slug' => 'negocio-other-branches']);
        $this->createBranch($otherBusiness, ['code' => 'OTH-BR-1']);

        $response = $this->getJson('/api/branches');

        $response->assertStatus(200)
            ->assertJsonFragment(['id' => $ownBranch->id])
            ->assertJsonMissing(['business_id' => $otherBusiness->id]);
    }

    public function test_service_category_crud_flow(): void
    {
        $ctx = $this->authenticatedTenant();
        $branch = $ctx['branch'];

        $created = $this->postJson('/api/service-categories', [
            'branch_id' => $branch->id,
            'name' => 'Cabello',
        ])->assertStatus(201)->json();

        $id = (int) $created['id'];

        $this->getJson('/api/service-categories')->assertStatus(200);
        $this->getJson("/api/service-categories/{$id}")->assertStatus(200);
        $this->putJson("/api/service-categories/{$id}", ['name' => 'Cabello premium'])->assertStatus(200);
        $this->deleteJson("/api/service-categories/{$id}")->assertStatus(200);
    }

    public function test_service_crud_flow(): void
    {
        $ctx = $this->authenticatedTenant();
        $business = $ctx['business'];
        $branch = $ctx['branch'];
        $category = $this->createServiceCategory($business, $branch);

        $created = $this->postJson('/api/services', [
            'branch_id' => $branch->id,
            'service_category_id' => $category->id,
            'name' => 'Corte clásico',
            'code' => 'SVC-TEST-001',
            'duration_minutes' => 45,
            'price_cents' => 2000,
            'currency' => 'USD',
        ])->assertStatus(201)->json();

        $id = (int) $created['id'];

        $this->getJson('/api/services')->assertStatus(200);
        $this->getJson("/api/services/{$id}")->assertStatus(200);
        $this->putJson("/api/services/{$id}", ['name' => 'Corte clásico + lavado'])->assertStatus(200);
        $this->deleteJson("/api/services/{$id}")->assertStatus(200);
    }

    public function test_professional_crud_flow(): void
    {
        $ctx = $this->authenticatedTenant();
        $branch = $ctx['branch'];

        $created = $this->postJson('/api/professionals', [
            'branch_id' => $branch->id,
            'name' => 'Profesional Test',
            'email' => 'pro-test@example.com',
        ])->assertStatus(201)->json();

        $id = (int) $created['id'];

        $this->getJson('/api/professionals')->assertStatus(200);
        $this->getJson("/api/professionals/{$id}")->assertStatus(200);
        $this->putJson("/api/professionals/{$id}", ['phone' => '+520000000'])->assertStatus(200);
        $this->deleteJson("/api/professionals/{$id}")->assertStatus(200);
    }

    public function test_client_crud_and_history_flow(): void
    {
        $ctx = $this->authenticatedTenant();
        $branch = $ctx['branch'];

        $created = $this->postJson('/api/clients', [
            'branch_id' => $branch->id,
            'name' => 'Cliente Historial',
            'email' => 'cliente-historial@example.com',
        ])->assertStatus(201)->json();

        $id = (int) ($created['data']['id'] ?? $created['id'] ?? 0);

        $this->getJson('/api/clients')->assertStatus(200);
        $this->getJson("/api/clients/{$id}")->assertStatus(200);
        $this->putJson("/api/clients/{$id}", ['phone' => '+5211111111'])->assertStatus(200);
        $this->getJson("/api/clients/{$id}/history")->assertStatus(200);
        $this->deleteJson("/api/clients/{$id}")->assertStatus(200);
    }

    public function test_working_hour_crud_flow(): void
    {
        $ctx = $this->authenticatedTenant();
        $business = $ctx['business'];
        $branch = $ctx['branch'];
        $professional = $this->createProfessional($business, $branch);

        $created = $this->postJson('/api/working-hours', [
            'branch_id' => $branch->id,
            'professional_id' => $professional->id,
            'weekday' => 1,
            'start_time' => '09:00',
            'end_time' => '18:00',
        ])->assertStatus(201)->json();

        $id = (int) $created['id'];

        $this->getJson('/api/working-hours')->assertStatus(200);
        $this->getJson("/api/working-hours/{$id}")->assertStatus(200);
        $this->putJson("/api/working-hours/{$id}", ['end_time' => '19:00'])->assertStatus(200);
        $this->deleteJson("/api/working-hours/{$id}")->assertStatus(200);
    }

    public function test_time_block_crud_flow(): void
    {
        $ctx = $this->authenticatedTenant();
        $business = $ctx['business'];
        $branch = $ctx['branch'];
        $professional = $this->createProfessional($business, $branch);
        $start = CarbonImmutable::now()->addDay()->setTime(12, 0);
        $end = $start->addMinutes(60);

        $created = $this->postJson('/api/blocks', [
            'branch_id' => $branch->id,
            'professional_id' => $professional->id,
            'start_at' => $start->toIso8601String(),
            'end_at' => $end->toIso8601String(),
            'reason' => 'Descanso',
        ])->assertStatus(201)->json();

        $id = (int) $created['id'];

        $this->getJson('/api/blocks')->assertStatus(200);
        $this->getJson("/api/blocks/{$id}")->assertStatus(200);
        $this->deleteJson("/api/blocks/{$id}")->assertStatus(200);
    }

    public function test_combined_service_crud_flow(): void
    {
        $ctx = $this->authenticatedTenant();
        $business = $ctx['business'];
        $branch = $ctx['branch'];
        $service = $this->createService($business, $branch);

        $created = $this->postJson('/api/combined-services', [
            'branch_id' => $branch->id,
            'name' => 'Paquete completo',
            'code' => 'PACK-001',
            'items' => [
                [
                    'service_id' => $service->id,
                    'position' => 1,
                    'offset_minutes' => 0,
                    'duration_minutes' => 30,
                ],
            ],
        ])->assertStatus(201)->json();

        $id = (int) $created['id'];

        $this->getJson('/api/combined-services')->assertStatus(200);
        $this->getJson("/api/combined-services/{$id}")->assertStatus(200);
        $this->putJson("/api/combined-services/{$id}", ['name' => 'Paquete premium'])->assertStatus(200);
        $this->deleteJson("/api/combined-services/{$id}")->assertStatus(200);
    }

    public function test_automation_crud_flow(): void
    {
        $this->authenticatedTenant();

        $created = $this->postJson('/api/automations', [
            'name' => 'Recordatorio',
            'trigger' => 'appointment_reminder',
            'action' => ['channel' => 'email'],
        ])->assertStatus(201)->json();

        $id = (int) $created['id'];

        $this->getJson('/api/automations')->assertStatus(200);
        $this->getJson("/api/automations/{$id}")->assertStatus(200);
        $this->putJson("/api/automations/{$id}", ['is_active' => false])->assertStatus(200);
        $this->deleteJson("/api/automations/{$id}")->assertStatus(200);
    }

    public function test_product_crud_flow(): void
    {
        $this->authenticatedTenant();

        $created = $this->postJson('/api/products', [
            'name' => 'Shampoo',
            'sku' => 'SKU-SHAMPOO-001',
            'cost_cents' => 500,
            'price_cents' => 1200,
        ])->assertStatus(201)->json();

        $id = (int) $created['id'];

        $this->getJson('/api/products')->assertStatus(200);
        $this->getJson("/api/products/{$id}")->assertStatus(200);
        $this->putJson("/api/products/{$id}", ['name' => 'Shampoo Plus'])->assertStatus(200);
        $this->deleteJson("/api/products/{$id}")->assertStatus(200);
    }
}
