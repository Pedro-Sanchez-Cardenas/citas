<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Professional;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class BusinessSeeder extends Seeder
{
    public function run(): void
    {
        // Negocio demo
        $business = Business::firstOrCreate(
            ['slug' => 'demo-beauty'],
            [
                'name' => 'Demo Beauty Studio',
                'owner_name' => 'Demo Owner',
                'owner_email' => 'test@example.com',
                'phone' => '+520000000000',
                'industry' => 'beauty',
                'settings' => [
                    'currency' => 'USD',
                ],
            ]
        );

        // Sucursal principal
        $branch = Branch::firstOrCreate(
            [
                'business_id' => $business->id,
                'code' => 'MAIN',
            ],
            [
                'name' => 'Sucursal principal',
                'timezone' => 'America/Mexico_City',
                'city' => 'Ciudad Demo',
                'country' => 'MX',
            ]
        );

        // Usuario de pruebas
        $user = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('password'),
            ]
        );

        if ($user->business_id !== $business->id) {
            $user->business_id = $business->id;
            $user->save();
        }

        // Categorías de servicio básicas
        if (! ServiceCategory::where('business_id', $business->id)->exists()) {
            $hair = ServiceCategory::create([
                'business_id' => $business->id,
                'branch_id' => $branch->id,
                'name' => 'Cabello',
                'description' => 'Cortes, color y peinados',
                'position' => 1,
                'is_active' => true,
            ]);

            $nails = ServiceCategory::create([
                'business_id' => $business->id,
                'branch_id' => $branch->id,
                'name' => 'Uñas',
                'description' => 'Manicure y pedicure',
                'position' => 2,
                'is_active' => true,
            ]);

            // Servicios demo
            $cut = Service::create([
                'business_id' => $business->id,
                'service_category_id' => $hair->id,
                'branch_id' => $branch->id,
                'name' => 'Corte clásico',
                'code' => 'CUT-CLASSIC',
                'duration_minutes' => 30,
                'price_cents' => 1500,
                'currency' => 'USD',
                'is_active' => true,
            ]);

            $color = Service::create([
                'business_id' => $business->id,
                'service_category_id' => $hair->id,
                'branch_id' => $branch->id,
                'name' => 'Color completo',
                'code' => 'COLOR-FULL',
                'duration_minutes' => 90,
                'price_cents' => 4500,
                'currency' => 'USD',
                'is_active' => true,
            ]);

            $manicure = Service::create([
                'business_id' => $business->id,
                'service_category_id' => $nails->id,
                'branch_id' => $branch->id,
                'name' => 'Manicure spa',
                'code' => 'NAILS-SPA',
                'duration_minutes' => 45,
                'price_cents' => 2500,
                'currency' => 'USD',
                'is_active' => true,
            ]);

            // Profesionales demo
            $pro1 = Professional::create([
                'business_id' => $business->id,
                'branch_id' => $branch->id,
                'name' => 'Alex',
                'email' => 'alex@example.com',
                'phone' => '+520000000001',
                'color' => '#22c55e',
                'commission_rate' => 40,
                'base_salary_cents' => 0,
                'is_active' => true,
            ]);

            $pro2 = Professional::create([
                'business_id' => $business->id,
                'branch_id' => $branch->id,
                'name' => 'Sarah',
                'email' => 'sarah@example.com',
                'phone' => '+520000000002',
                'color' => '#38bdf8',
                'commission_rate' => 35,
                'base_salary_cents' => 0,
                'is_active' => true,
            ]);

            // Relacionar profesionales con servicios
            $cut->professionals()->sync([$pro1->id, $pro2->id]);
            $color->professionals()->sync([$pro2->id]);
            $manicure->professionals()->sync([$pro2->id]);

            // Productos básicos
            $shampoo = Product::create([
                'business_id' => $business->id,
                'name' => 'Shampoo hidratante',
                'sku' => 'PROD-SHAMPOO',
                'category' => 'Cabello',
                'unit' => 'ml',
                'cost_cents' => 500,
                'price_cents' => 1200,
                'is_reusable' => false,
            ]);

            $tint = Product::create([
                'business_id' => $business->id,
                'name' => 'Tinte rubio 7.1',
                'sku' => 'PROD-TINT-71',
                'category' => 'Color',
                'unit' => 'ml',
                'cost_cents' => 800,
                'price_cents' => 2000,
                'is_reusable' => false,
            ]);

            // Asociar productos a servicios mediante la tabla pivote service_product
            $shampoo->services()->attach($cut->id, ['quantity' => 10]);
            $tint->services()->attach($color->id, ['quantity' => 30]);
        }
    }
}

