<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_profiles', function (Blueprint $table): void {
            $table->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $table->string('city', 100)->nullable();
            $table->string('sector', 100)->nullable();
            $table->text('description')->nullable();
            $table->text('website')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_profiles');
    }
};
