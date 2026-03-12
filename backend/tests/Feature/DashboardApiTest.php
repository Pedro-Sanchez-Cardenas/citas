<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DashboardApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_returns_401_when_unauthenticated(): void
    {
        $response = $this->getJson('/api/dashboard');

        $response->assertStatus(401);
    }

    public function test_dashboard_returns_data_when_authenticated(): void
    {
        $business = Business::create([
            'name' => 'Negocio dashboard',
            'slug' => 'negocio-dashboard',
            'owner_name' => 'Owner',
            'owner_email' => 'owner-dashboard@example.com',
            'industry' => 'beauty',
        ]);
        $user = User::factory()->create(['business_id' => $business->id]);

        $response = $this->actingAs($user)->getJson('/api/dashboard');

        $response->assertStatus(200)
            ->assertJsonStructure(['message', 'user', 'cards'])
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonStructure(['cards' => [['title', 'value']]]);
    }

    public function test_business_setup_endpoint_returns_ok_when_authenticated(): void
    {
        $business = Business::create([
            'name' => 'Negocio setup',
            'slug' => 'negocio-setup',
            'owner_name' => 'Owner',
            'owner_email' => 'owner-setup@example.com',
            'industry' => 'beauty',
        ]);
        $user = User::factory()->create(['business_id' => $business->id]);
        $ownerRole = Role::findOrCreate('business_owner');
        $user->assignRole($ownerRole);

        $this->actingAs($user)
            ->getJson('/api/business-setup')
            ->assertStatus(200);
    }
}
