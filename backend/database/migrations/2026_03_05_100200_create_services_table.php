<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')
                ->constrained('businesses')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreignId('service_category_id')
                ->nullable()
                ->constrained('service_categories')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->foreignId('branch_id')
                ->nullable()
                ->constrained('branches')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->unsignedInteger('duration_minutes'); // duración base, soporta servicios de duración variable
            $table->unsignedInteger('price_cents')->nullable();
            $table->string('currency', 3)->default('USD');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Tabla pivote para servicios que pueden ser realizados por profesionales específicos
        Schema::create('professional_service', function (Blueprint $table) {
            $table->id();
            $table->foreignId('professional_id')
                ->constrained('professionals')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->foreignId('service_id')
                ->constrained('services')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['professional_id', 'service_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('professional_service');
        Schema::dropIfExists('services');
    }
};

