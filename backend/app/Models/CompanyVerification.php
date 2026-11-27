<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompanyVerification extends Model
{
    protected $guarded = ['id'];

    protected $hidden = ['document_path'];

    public function decisions(): HasMany
    {
        return $this->hasMany(VerificationDecision::class);
    }
}
