<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveStudentProfile extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role === 'student';
    }

    public function rules(): array
    {
        return [
            'bio' => 'nullable|string|max:1200',
            'skills' => 'nullable|string|max:500',
            'links' => 'sometimes|array|list|max:10',
            'links.*' => 'required|array:name,url',
            'links.*.name' => 'required|string|max:80',
            'links.*.url' => 'required|url:http,https|max:2048',
            'photo' => 'nullable|file|image|mimes:jpg,jpeg,png,webp|max:2048|dimensions:max_width=4096,max_height=4096',
            'remove_photo' => 'sometimes|boolean',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('links'))) {
            $links = json_decode($this->input('links'), true);
            if (is_array($links)) {
                foreach ($links as &$link) {
                    if (is_array($link)) {
                        foreach (['name', 'url'] as $field) {
                            if (is_string($link[$field] ?? null)) {
                                $link[$field] = trim($link[$field]);
                            }
                        }
                    }
                }
                unset($link);
                $this->merge(['links' => $links]);
            }
        }
    }

    public function messages(): array
    {
        return [
            'links.max' => 'Ajoutez au maximum dix liens.',
            'links.*.name.required' => 'Saisissez le nom de la plateforme.',
            'links.*.name.max' => 'Utilisez au maximum 80 caractères pour le nom.',
            'links.*.url.required' => 'Saisissez l’adresse du lien.',
            'links.*.url.url' => 'Saisissez un lien valide commençant par http:// ou https://.',
            'photo.image' => 'Choisissez une image JPG, PNG ou WebP.',
            'photo.mimes' => 'Choisissez une image JPG, PNG ou WebP.',
            'photo.max' => 'La photo est limitée à 2 Mo.',
            'photo.dimensions' => 'La photo est limitée à 4096 × 4096 pixels.',
            'photo.uploaded' => 'La photo n’a pas pu être envoyée.',
        ];
    }
}
