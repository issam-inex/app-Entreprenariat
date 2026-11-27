<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::connection(config('queue.connections.database.connection'))
            ->table(config('queue.connections.database.table'))
            ->where('queue', 'delivery-scans')
            ->delete();
    }

    public function down(): void
    {
        // Cancelled jobs are not restored by rolling back.
    }
};
