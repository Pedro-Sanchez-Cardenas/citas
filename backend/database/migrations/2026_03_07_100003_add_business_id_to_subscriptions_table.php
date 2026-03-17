<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            if (! Schema::hasColumn('subscriptions', 'business_id')) {
                $table->foreignId('business_id')
                    ->nullable()
                    ->after('type')
                    ->constrained('businesses')
                    ->cascadeOnUpdate()
                    ->nullOnDelete();

                $table->index(['business_id', 'created_at']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            if (Schema::hasColumn('subscriptions', 'business_id')) {
                $table->dropConstrainedForeignId('business_id');
            }
        });
    }
};

