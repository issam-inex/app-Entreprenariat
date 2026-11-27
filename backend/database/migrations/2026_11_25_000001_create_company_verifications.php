<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('missions', function (Blueprint $table): void {
            $table->string('status', 16)->default('draft');
            $table->index(['status', 'id']);
        });
        Schema::create('company_verifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('company_id')->constrained('users');
            $table->unsignedInteger('attempt');
            $table->unique(['company_id', 'attempt']);
            $table->string('legal_name', 180);
            $table->string('ice', 15);
            $table->string('commerce_register', 40);
            $table->string('registration_city', 100);
            $table->string('representative_name', 120);
            $table->string('representative_position', 120);
            $table->string('professional_email', 254);
            $table->string('document_path');
            $table->string('status', 16)->default('pending');
            $table->index(['status', 'id']);
            $table->timestamps();
        });
        Schema::create('verification_decisions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('company_verification_id')->constrained();
            $table->foreignId('admin_id')->constrained('users');
            $table->string('status', 16);
            $table->text('reason');
            $table->boolean('legal_checked');
            $table->boolean('representative_checked');
            $table->timestamp('created_at');
        });
        Schema::create('verification_document_accesses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('company_verification_id')->constrained();
            $table->foreignId('user_id')->constrained();
            $table->timestamp('created_at');
        });
        DB::table('users')->where('role', 'company')->where('status', 'approved')->update(['status' => 'pending']);
    }

    public function down(): void
    {
        Schema::dropIfExists('verification_document_accesses');
        Schema::dropIfExists('verification_decisions');
        Schema::dropIfExists('company_verifications');
        Schema::table('missions', function (Blueprint $table): void {
            $table->dropIndex(['status', 'id']);
            $table->dropColumn('status');
        });
    }
};
