<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_profiles', fn (Blueprint $table) => $table->json('links')->nullable());

        $labels = ['linkedin' => 'LinkedIn', 'github' => 'GitHub', 'portfolio' => 'Portfolio', 'other_link' => 'Autre'];
        DB::table('student_profiles')->eachById(function ($profile) use ($labels): void {
            $links = [];
            foreach ($labels as $field => $name) {
                if (filled($profile->{$field})) {
                    $links[] = ['name' => $name, 'url' => $profile->{$field}];
                }
            }
            if ($links !== []) {
                DB::table('student_profiles')->where('user_id', $profile->user_id)
                    ->update(['links' => json_encode($links, JSON_THROW_ON_ERROR)]);
            }
        }, 100, 'user_id');
    }

    public function down(): void
    {
        Schema::table('student_profiles', fn (Blueprint $table) => $table->dropColumn('links'));
    }
};
