<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('combined_services', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')
                ->constrained('businesses')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreignId('branch_id')
                ->nullable()
                ->constrained('branches')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->unsignedInteger('total_duration_minutes')->nullable(); // opcional, puede calcularse a partir de los items
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('combined_service_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('combined_service_id')
                ->constrained('combined_services')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->foreignId('service_id')
                ->constrained('services')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->unsignedSmallInteger('position')->default(1);
            $table->unsignedInteger('offset_minutes')->default(0); // por si se solapan servicios en el combinado
            $table->timestamps();

            $table->unique(['combined_service_id', 'service_id', 'position'], 'combined_service_items_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('combined_service_items');
        Schema::dropIfExists('combined_services');
    }
};

