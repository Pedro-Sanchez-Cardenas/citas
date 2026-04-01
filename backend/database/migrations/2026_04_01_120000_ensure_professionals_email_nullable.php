<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * El correo solo es obligatorio al crear cuenta worker; el esquema debe permitir NULL.
     */
    public function up(): void
    {
        Schema::table('professionals', function (Blueprint $table) {
            // El índice único ya existe en migraciones anteriores; solo aseguramos NULL permitido.
            $table->string('email')->nullable()->change();
        });
    }

    public function down(): void
    {
        // No revertir a NOT NULL: puede haber filas con email NULL (profesional sin cuenta worker).
    }
};
