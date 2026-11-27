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
            $table->string('delivery_scan_status', 16)->nullable()->index();
            $table->dateTime('delivery_link_reported_at')->nullable();
        });

        DB::table('missions')->whereNotNull('delivery_attachment_path')->update(['delivery_scan_status' => 'pending']);
    }

    public function down(): void
    {
        Schema::table('missions', function (Blueprint $table): void {
            $table->dropIndex(['delivery_scan_status']);
            $table->dropColumn(['delivery_scan_status', 'delivery_link_reported_at']);
        });
    }
};
