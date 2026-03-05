<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('time_blocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')
                ->nullable()
                ->constrained('branches')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->foreignId('professional_id')
                ->nullable()
                ->constrained('professionals')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->string('reason')->nullable();
            $table->string('type')->default('manual'); // manual, mantenimiento, feriado, etc.
            $table->timestamps();

            $table->index(['branch_id', 'professional_id', 'start_at', 'end_at'], 'time_blocks_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('time_blocks');
    }
};

