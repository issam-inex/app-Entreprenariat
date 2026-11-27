<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_profiles', function (Blueprint $table): void {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->text('bio')->nullable();
            $table->string('skills', 500)->nullable();
            foreach (['linkedin', 'github', 'portfolio', 'other_link'] as $field) {
                $table->text($field)->nullable();
            }
            $table->string('photo_path')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_profiles');
    }
};
