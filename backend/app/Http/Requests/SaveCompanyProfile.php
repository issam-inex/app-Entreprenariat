<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveCompanyProfile extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role === 'company';
    }

    public function rules(): array
    {
        return [
            'city' => 'present|nullable|string|max:100',
            'sector' => 'present|nullable|string|max:100',
            'description' => 'present|nullable|string|max:2000',
            'website' => 'present|nullable|url:http,https|max:2048',
            'photo' => 'nullable|file|image|mimes:jpg,jpeg,png,webp|max:2048|dimensions:max_width=4096,max_height=4096',
            'remove_photo' => 'sometimes|boolean',
        ];
    }

    public function messages(): array
    {
        return [
            'website.url' => 'Saisissez un lien valide commençant par http:// ou https://.',
            'photo.image' => 'Choisissez une image JPG, PNG ou WebP.',
            'photo.mimes' => 'Choisissez une image JPG, PNG ou WebP.',
            'photo.max' => 'La photo est limitée à 2 Mo.',
            'photo.dimensions' => 'La photo est limitée à 4096 × 4096 pixels.',
            'photo.uploaded' => 'La photo n’a pas pu être envoyée.',
        ];
    }
}
