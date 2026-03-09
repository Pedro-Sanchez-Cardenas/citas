<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationGuardsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_protected_endpoints_require_authentication(): void
    {
        $this->getJson('/api/dashboard')->assertStatus(401);
        $this->getJson('/api/branches')->assertStatus(401);
        $this->getJson('/api/agenda/day')->assertStatus(401);
        $this->getJson('/api/appointments')->assertStatus(401);
        $this->getJson('/api/services')->assertStatus(401);
        $this->getJson('/api/professionals')->assertStatus(401);
        $this->getJson('/api/clients')->assertStatus(401);
        $this->getJson('/api/products')->assertStatus(401);
        $this->getJson('/api/reports/business-summary')->assertStatus(401);
    }
}
