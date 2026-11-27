<?php

namespace App\Http\Requests;

use App\Models\CompanyVerification;
use Illuminate\Foundation\Http\FormRequest;

class DecideCompanyVerification extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('review', CompanyVerification::class);
    }

    public function rules(): array
    {
        return [
            'status' => 'required|in:verified,rejected,suspended,pending',
            'expected_status' => 'required|in:verified,rejected,suspended,pending',
            'reason' => 'required|string|max:2000',
            'legal_checked' => 'required_if:status,verified|boolean|accepted_if:status,verified',
            'representative_checked' => 'required_if:status,verified|boolean|accepted_if:status,verified',
        ];
    }
}
