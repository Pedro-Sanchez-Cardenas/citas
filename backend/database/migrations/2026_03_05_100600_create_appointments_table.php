<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')
                ->constrained('businesses')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreignId('branch_id')
                ->constrained('branches')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreignId('professional_id')
                ->constrained('professionals')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreignId('service_id')
                ->nullable()
                ->constrained('services')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->foreignId('combined_service_id')
                ->nullable()
                ->constrained('combined_services')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->foreignId('client_id')
                ->nullable()
                ->constrained('clients')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->string('client_name');
            $table->string('client_phone')->nullable();
            $table->string('client_email')->nullable();
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->enum('status', ['scheduled', 'confirmed', 'attended', 'cancelled', 'no_show'])
                ->default('scheduled');
            $table->string('source')->nullable(); // online, teléfono, interno, etc.
            $table->unsignedInteger('deposit_amount_cents')->default(0);
            $table->enum('deposit_status', ['pending', 'paid', 'refunded'])->default('pending');
            $table->boolean('overbooking_allowed')->default(false);
            $table->unsignedSmallInteger('buffer_before_minutes')->default(0);
            $table->unsignedSmallInteger('buffer_after_minutes')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['professional_id', 'start_at', 'end_at'], 'appointments_professional_index');
            $table->index(['branch_id', 'start_at', 'end_at'], 'appointments_branch_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};

