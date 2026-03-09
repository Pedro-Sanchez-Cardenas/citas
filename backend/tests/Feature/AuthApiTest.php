<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_fails_with_invalid_credentials(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'noexiste@test.com',
            'password' => 'wrong',
        ]);

        $response->assertStatus(401)
            ->assertJson(['message' => 'Credenciales inválidas']);
    }

    public function test_login_succeeds_and_returns_user(): void
    {
        $business = Business::create([
            'name' => 'Negocio login',
            'slug' => 'negocio-login',
            'owner_name' => 'Owner',
            'owner_email' => 'owner-login@example.com',
            'industry' => 'beauty',
        ]);

        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123'),
            'business_id' => $business->id,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['user' => ['id', 'name', 'email']])
            ->assertJsonPath('user.email', 'test@example.com');
    }

    public function test_me_returns_401_when_unauthenticated(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertStatus(401);
    }

    public function test_me_returns_user_when_authenticated(): void
    {
        $business = Business::create([
            'name' => 'Negocio me',
            'slug' => 'negocio-me',
            'owner_name' => 'Owner',
            'owner_email' => 'owner-me@example.com',
            'industry' => 'beauty',
        ]);
        $user = User::factory()->create(['business_id' => $business->id]);

        $response = $this->actingAs($user)->getJson('/api/me');

        $response->assertStatus(200)
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonPath('user.email', $user->email);
    }

    public function test_logout_invalidates_session(): void
    {
        $business = Business::create([
            'name' => 'Negocio logout',
            'slug' => 'negocio-logout',
            'owner_name' => 'Owner',
            'owner_email' => 'owner-logout@example.com',
            'industry' => 'beauty',
        ]);
        $user = User::factory()->create(['business_id' => $business->id]);
        $this->actingAs($user)->postJson('/api/logout')->assertStatus(200);

        $this->getJson('/api/me')->assertStatus(401);
    }

    public function test_update_profile_updates_name_and_email(): void
    {
        $business = Business::create([
            'name' => 'Negocio profile',
            'slug' => 'negocio-profile',
            'owner_name' => 'Owner',
            'owner_email' => 'owner-profile@example.com',
            'industry' => 'beauty',
        ]);
        $user = User::factory()->create([
            'business_id' => $business->id,
            'email' => 'before@example.com',
            'name' => 'Before Name',
        ]);

        $response = $this->actingAs($user)->patchJson('/api/me', [
            'name' => 'After Name',
            'email' => 'after@example.com',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.name', 'After Name')
            ->assertJsonPath('user.email', 'after@example.com');
    }
}
