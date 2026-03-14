<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('client_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('appointment_id')->nullable()->constrained('appointments')->cascadeOnUpdate()->nullOnDelete();

            $table->string('type')->default('other'); // before, after, other
            $table->string('photo_path');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_media');
    }
};
