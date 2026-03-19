<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('working_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained('businesses')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->cascadeOnUpdate()->nullOnDelete();

            $table->foreignId('professional_id')->nullable()->constrained('professionals')->cascadeOnUpdate()->nullOnDelete();

            $table->unsignedTinyInteger('weekday');
            $table->time('start_time');
            $table->time('end_time');
            $table->date('effective_from')->nullable();
            $table->date('effective_until')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['branch_id', 'professional_id', 'weekday'], 'working_hours_index');

            $table->unique(['branch_id', 'professional_id', 'weekday', 'start_time', 'end_time'], 'working_hours_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('working_hours');
    }
};
