<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('automations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')
                ->constrained('businesses')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->string('name');
            $table->enum('trigger', ['appointment_reminder', 'inactive_client', 'birthday', 'promotion'])->index();
            $table->json('conditions')->nullable(); // reglas específicas (días inactivo, servicio, etc.)
            $table->json('action')->nullable(); // contenido mensaje, canal (WhatsApp, email, SMS)
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('automation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('automation_id')
                ->constrained('automations')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->foreignId('client_id')
                ->nullable()
                ->constrained('clients')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->string('channel')->nullable(); // email, whatsapp, sms
            $table->string('status')->default('sent'); // sent, failed, skipped
            $table->text('error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('automation_logs');
        Schema::dropIfExists('automations');
    }
};

