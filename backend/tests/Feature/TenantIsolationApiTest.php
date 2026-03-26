<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Automation;
use App\Models\Product;
use App\Models\TimeBlock;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Support\CreatesTenantData;
use Tests\TestCase;

class TenantIsolationApiTest extends TestCase
{
    use RefreshDatabase;
    use CreatesTenantData;

    public function test_user_cannot_access_resources_from_another_business_by_route_model_binding(): void
    {
        $ctxA = $this->authenticatedTenant();
        $businessA = $ctxA['business'];
        $branchA = $ctxA['branch'];
        $this->createProfessional($businessA, $branchA);

        $businessB = $this->createBusiness(['slug' => 'negocio-aislado-b']);
        $branchB = $this->createBranch($businessB, ['code' => 'ISOL-B-1']);
        $serviceB = $this->createService($businessB, $branchB);
        $productB = Product::create([
            'business_id' => $businessB->id,
            'name' => 'Producto B',
            'sku' => 'SKU-B-123',
        ]);
        $automationB = Automation::create([
            'business_id' => $businessB->id,
            'name' => 'Auto B',
            'trigger' => 'promotion',
            'is_active' => true,
        ]);

        $start = CarbonImmutable::now()->addDay()->setTime(11, 0);
        $clientB = $this->createClient($businessB, $branchB, ['name' => 'Cliente B']);
        $appointmentB = Appointment::create([
            'business_id' => $businessB->id,
            'branch_id' => $branchB->id,
            'professional_id' => $this->createProfessional($businessB, $branchB)->id,
            'client_id' => $clientB->id,
            'start_at' => $start,
            'end_at' => $start->addMinutes(30),
            'status' => 'scheduled',
        ]);

        $blockB = TimeBlock::create([
            'business_id' => $businessB->id,
            'branch_id' => $branchB->id,
            'professional_id' => null,
            'start_at' => $start,
            'end_at' => $start->addMinutes(60),
            'reason' => 'Block B',
        ]);

        $this->getJson("/api/services/{$serviceB->id}")->assertStatus(404);
        $this->getJson("/api/products/{$productB->id}")->assertStatus(404);
        $this->getJson("/api/automations/{$automationB->id}")->assertStatus(404);
        $this->getJson("/api/appointments/{$appointmentB->id}")->assertStatus(404);
        $this->getJson("/api/blocks/{$blockB->id}")->assertStatus(404);

        // sanity check: resource own business is still reachable
        $serviceA = $this->createService($businessA, $branchA);
        $this->getJson("/api/services/{$serviceA->id}")->assertStatus(200);
    }

    public function test_user_cannot_create_appointment_with_foreign_ids(): void
    {
        $ctxA = $this->authenticatedTenant();
        $businessA = $ctxA['business'];
        $branchA = $ctxA['branch'];
        $professionalA = $this->createProfessional($businessA, $branchA);

        $businessB = $this->createBusiness(['slug' => 'negocio-ids-foraneos']);
        $branchB = $this->createBranch($businessB, ['code' => 'FOR-BR-1']);
        $professionalB = $this->createProfessional($businessB, $branchB);

        $start = CarbonImmutable::now()->addDay()->setTime(13, 0);
        $this->createWorkingHour($businessA, $branchA, $professionalA, $start);

        $clientB = $this->createClient($businessB, $branchB, ['name' => 'Intento foraneo']);
        $this->postJson('/api/appointments', [
            'branch_id' => $branchB->id,
            'professional_id' => $professionalB->id,
            'client_id' => $clientB->id,
            'start_at' => $start->toIso8601String(),
            'end_at' => $start->addMinutes(30)->toIso8601String(),
        ])->assertStatus(404);
    }

    public function test_user_cannot_adjust_inventory_using_foreign_branch(): void
    {
        $ctxA = $this->authenticatedTenant();
        $businessA = $ctxA['business'];
        $branchA = $ctxA['branch'];
        $productA = Product::create([
            'business_id' => $businessA->id,
            'name' => 'Producto A',
            'sku' => 'SKU-A-INV',
        ]);

        $businessB = $this->createBusiness(['slug' => 'negocio-branch-foranea']);
        $branchB = $this->createBranch($businessB, ['code' => 'FOR-INV-B']);

        $this->postJson('/api/inventory/adjust', [
            'branch_id' => $branchB->id,
            'product_id' => $productA->id,
            'type' => 'in',
            'quantity' => 2,
        ])->assertStatus(404);

        $this->postJson('/api/inventory/adjust', [
            'branch_id' => $branchA->id,
            'product_id' => $productA->id,
            'type' => 'in',
            'quantity' => 2,
        ])->assertStatus(200);
    }
}
