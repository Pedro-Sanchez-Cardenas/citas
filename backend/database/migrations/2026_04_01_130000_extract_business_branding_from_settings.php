<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_brandings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')
                ->unique()
                ->constrained('businesses')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->string('logo_path')->nullable();
            $table->string('hero_image_path')->nullable();
            $table->string('primary_color', 20)->nullable();
            $table->string('public_booking_title', 120)->nullable();
            $table->string('public_booking_subtitle', 255)->nullable();
            $table->timestamps();
        });

        Schema::table('businesses', function (Blueprint $table) {
            $table->boolean('auto_confirm_appointments')->default(true)->after('industry');
            $table->unsignedSmallInteger('max_overbooking_per_slot')->default(1)->after('auto_confirm_appointments');
        });

        $businesses = DB::table('businesses')->select(['id', 'settings'])->get();
        foreach ($businesses as $business) {
            $settings = [];
            if (is_string($business->settings) && $business->settings !== '') {
                $decoded = json_decode($business->settings, true);
                $settings = is_array($decoded) ? $decoded : [];
            } elseif (is_array($business->settings)) {
                $settings = $business->settings;
            }

            $branding = is_array($settings['branding'] ?? null) ? $settings['branding'] : [];
            DB::table('business_brandings')->updateOrInsert(
                ['business_id' => $business->id],
                [
                    'logo_path' => $branding['logo_path'] ?? null,
                    'hero_image_path' => $branding['hero_image_path'] ?? null,
                    'primary_color' => $branding['primary_color'] ?? null,
                    'public_booking_title' => $branding['public_booking_title'] ?? null,
                    'public_booking_subtitle' => $branding['public_booking_subtitle'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            DB::table('businesses')
                ->where('id', $business->id)
                ->update([
                    'auto_confirm_appointments' => (bool) ($settings['auto_confirm_appointments'] ?? true),
                    'max_overbooking_per_slot' => max(1, (int) ($settings['max_overbooking_per_slot'] ?? 1)),
                ]);
        }

        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn('settings');
        });
    }

    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->json('settings')->nullable()->after('industry');
        });

        $businesses = DB::table('businesses')->select(['id', 'auto_confirm_appointments', 'max_overbooking_per_slot'])->get();
        foreach ($businesses as $business) {
            $branding = DB::table('business_brandings')->where('business_id', $business->id)->first();
            $settings = [
                'auto_confirm_appointments' => (bool) $business->auto_confirm_appointments,
                'max_overbooking_per_slot' => (int) $business->max_overbooking_per_slot,
                'branding' => [
                    'logo_path' => $branding->logo_path ?? null,
                    'hero_image_path' => $branding->hero_image_path ?? null,
                    'primary_color' => $branding->primary_color ?? null,
                    'public_booking_title' => $branding->public_booking_title ?? null,
                    'public_booking_subtitle' => $branding->public_booking_subtitle ?? null,
                ],
            ];

            DB::table('businesses')
                ->where('id', $business->id)
                ->update(['settings' => json_encode($settings)]);
        }

        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn(['auto_confirm_appointments', 'max_overbooking_per_slot']);
        });

        Schema::dropIfExists('business_brandings');
    }
};
