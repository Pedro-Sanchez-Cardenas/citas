<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Support\CreatesTenantData;
use Tests\TestCase;

class ReportsApiTest extends TestCase
{
    use RefreshDatabase;
    use CreatesTenantData;

    public function test_reports_endpoints_return_ok_for_authenticated_business(): void
    {
        $ctx = $this->authenticatedTenant();
        $branch = $ctx['branch'];

        $this->getJson('/api/reports/business-summary')->assertStatus(200);
        $this->getJson('/api/reports/professionals?branch_id='.$branch->id)->assertStatus(200);
        $this->getJson('/api/reports/services?branch_id='.$branch->id)->assertStatus(200);
    }
}
