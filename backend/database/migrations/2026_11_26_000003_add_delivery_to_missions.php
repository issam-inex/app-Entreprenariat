<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('missions', function (Blueprint $table): void {
            $table->dateTime('started_at')->nullable();
            $table->text('delivery_url')->nullable();
            $table->dateTime('delivery_submitted_at')->nullable();
            $table->dateTime('completed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('missions', fn (Blueprint $table) => $table->dropColumn([
            'started_at', 'delivery_url', 'delivery_submitted_at', 'completed_at',
        ]));
    }
};
