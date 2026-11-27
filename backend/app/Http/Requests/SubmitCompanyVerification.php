<?php

namespace App\Http\Requests;

use App\Models\CompanyVerification;
use Illuminate\Foundation\Http\FormRequest;

class SubmitCompanyVerification extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('submit', CompanyVerification::class);
    }

    public function rules(): array
    {
        return [
            'legal_name' => 'required|string|max:180',
            'ice' => 'required|digits:15',
            'commerce_register' => 'required|string|max:40',
            'registration_city' => 'required|string|max:100',
            'representative_name' => 'required|string|max:120',
            'representative_position' => 'required|string|max:120',
            'document' => 'required|file|mimes:pdf|max:10240',
            'status' => 'prohibited',
            'company_id' => 'prohibited',
        ];
    }

    public function messages(): array
    {
        return [
            'document.required' => 'Ajoutez le justificatif légal.',
            'document.file' => 'Le justificatif doit être un fichier.',
            'document.mimes' => 'Le justificatif doit être un fichier PDF valide.',
            'document.max' => 'Le fichier ne doit pas dépasser 10 Mo.',
            'document.uploaded' => 'Le fichier n’a pas pu être envoyé. Vérifiez qu’il ne dépasse pas 10 Mo.',
            'ice.digits' => 'L’ICE doit comporter exactement 15 chiffres.',
        ];
    }
}
