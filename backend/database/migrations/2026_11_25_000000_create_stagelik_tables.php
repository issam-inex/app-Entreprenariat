<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('role', 16)->default('student');
            $table->string('status', 16)->default('approved');
        });

        Schema::create('missions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('company_id')->constrained('users');
            $table->string('title', 180);
            $table->text('description');
            $table->string('duration', 100);
            $table->string('skills', 500);
        });

        Schema::create('applications', function (Blueprint $table): void {
            $table->foreignId('mission_id')->constrained();
            $table->foreignId('student_id')->constrained('users');
            $table->primary(['mission_id', 'student_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
        Schema::dropIfExists('missions');
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn(['role', 'status']));
    }
};
