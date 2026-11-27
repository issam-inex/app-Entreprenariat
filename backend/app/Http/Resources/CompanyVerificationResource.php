<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompanyVerificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            ...$this->resource->only(['id', 'attempt', 'legal_name', 'ice', 'commerce_register',
                'registration_city', 'representative_name', 'representative_position', 'professional_email', 'status', 'created_at']),
            'is_current' => $this->whenHas('latest_attempt', fn () => (int) $this->attempt === (int) $this->latest_attempt),
            'decisions' => $this->whenLoaded('decisions', fn () => $this->decisions->map(
                fn ($decision) => $decision->only(['status', 'reason', 'created_at'])
                    + ($request->user()->role === 'admin' ? $decision->only(['admin_id', 'legal_checked', 'representative_checked']) : [])
            )),
        ];
    }
}
