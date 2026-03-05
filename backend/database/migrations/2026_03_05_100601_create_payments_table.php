<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')
                ->constrained('businesses')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreignId('branch_id')
                ->constrained('branches')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->foreignId('appointment_id')
                ->nullable()
                ->constrained('appointments')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->foreignId('client_id')
                ->nullable()
                ->constrained('clients')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->string('method'); // efectivo, tarjeta, Stripe, MP, etc.
            $table->unsignedInteger('amount_cents');
            $table->unsignedInteger('tip_cents')->default(0);
            $table->string('currency', 3)->default('USD');
            $table->enum('status', ['pending', 'paid', 'failed', 'refunded'])->default('paid');
            $table->string('provider')->nullable(); // stripe, mp, terminal_fisica
            $table->string('provider_payment_id')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

