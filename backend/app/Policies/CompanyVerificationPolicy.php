<?php

namespace App\Policies;

use App\Models\CompanyVerification;
use App\Models\User;

class CompanyVerificationPolicy
{
    public function review(User $user): bool
    {
        return $user->role === 'admin' && $user->hasVerifiedEmail();
    }

    public function submit(User $user): bool
    {
        return $user->role === 'company' && $user->hasVerifiedEmail();
    }

    public function view(User $user, CompanyVerification $verification): bool
    {
        return $this->review($user) || ($user->role === 'company' && $user->id === $verification->company_id);
    }
}
