<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('missions', function (Blueprint $table): void {
            foreach (['objectives', 'instructions', 'deliverables', 'evaluation_criteria'] as $column) {
                $table->text($column)->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('missions', fn (Blueprint $table) => $table->dropColumn([
            'objectives', 'instructions', 'deliverables', 'evaluation_criteria',
        ]));
    }
};
