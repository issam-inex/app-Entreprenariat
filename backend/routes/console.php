<?php

use App\Models\User;
use Illuminate\Support\Facades\Artisan;

Artisan::command('stagelik:grant-admin {email}', function (string $email): int {
    $user = User::where('email', strtolower(trim($email)))->first();
    if (! $user || ! $user->hasVerifiedEmail() || $user->role === 'company') {
        $this->error('Un compte avec une adresse confirmée et sans profil entreprise est requis.');

        return 1;
    }
    if (! $this->confirm('Accorder les droits administrateur à ce compte ?')) {
        return 1;
    }
    $user->forceFill(['role' => 'admin'])->save();
    $this->info('Droits administrateur accordés.');

    return 0;
})->purpose('Accorder les droits administrateur lors du provisionnement interne');
