<?php

namespace App\Policies;

use App\Models\Mission;
use App\Models\User;

class MissionPolicy
{
    public function create(User $account): bool
    {
        return $account->role === 'company';
    }

    public function update(User $account, Mission $mission): bool
    {
        return $this->create($account) && $account->id === $mission->company_id
            && ($mission->status === 'draft' || $this->publish($account, $mission));
    }

    public function publish(User $account, Mission $mission): bool
    {
        return $this->create($account) && $account->id === $mission->company_id
            && $account->status === 'verified' && $account->hasVerifiedEmail();
    }

    public function delete(User $account, Mission $mission): bool
    {
        return $this->update($account, $mission);
    }
}
