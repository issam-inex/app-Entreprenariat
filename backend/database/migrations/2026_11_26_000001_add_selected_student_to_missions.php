<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('missions', fn (Blueprint $table) => $table->foreignId('selected_student_id')->nullable()->constrained('users'));
    }

    public function down(): void
    {
        Schema::table('missions', fn (Blueprint $table) => $table->dropConstrainedForeignId('selected_student_id'));
    }
};
