<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnUpdate()->restrictOnDelete();

            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->cascadeOnUpdate()->nullOnDelete();
            $table->foreignId('client_id')->nullable()->constrained('clients')->cascadeOnUpdate()->nullOnDelete();

            $table->enum('method', ['cash', 'card', 'transfer', 'other'])->default('cash');
            $table->unsignedInteger('amount_cents');
            $table->unsignedInteger('tip_cents')->default(0);
            $table->string('currency', 3)->default('USD');
            $table->enum('status', ['pending', 'paid', 'failed', 'refunded'])->default('paid');
            $table->string('provider')->nullable(); // stripe, mp, terminal_physical
            $table->string('provider_payment_id')->nullable();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['branch_id', 'created_at']);
        });

        Schema::table('payment_items', function (Blueprint $table) {
            $table->foreignId('payment_id')->constrained('payments')->cascadeOnUpdate()->cascadeOnDelete();

            $table->foreignId('service_id')->constrained('services')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnUpdate()->cascadeOnDelete();
            $table->integer('quantity')->default(1);
            $table->unsignedInteger('price_cents');
            $table->unsignedInteger('total_cents');
            $table->timestamps();

            $table->index(['payment_id', 'service_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
