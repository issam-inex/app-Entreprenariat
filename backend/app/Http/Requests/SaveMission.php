<?php

namespace App\Http\Requests;

use App\Models\Mission;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveMission extends FormRequest
{
    public function rules(): array
    {
        $rules = ['company_id' => 'prohibited', 'status' => 'prohibited', 'category' => ['nullable', Rule::in(Mission::CATEGORIES)]];
        $rules['attachments'] = 'sometimes|array|max:3';
        $rules['attachments.*'] = 'required|file|max:2048|extensions:pdf,png,jpg,jpeg,docx,xlsx,pptx|mimes:pdf,png,jpg,jpeg,docx,xlsx,pptx';
        $rules['remove_attachments'] = 'sometimes|array|max:3';
        $rules['remove_attachments.*'] = 'required|integer|min:1|distinct';
        foreach (Mission::FIELD_LIMITS as $field => $limit) {
            $presence = in_array($field, ['title', 'description', 'duration', 'skills'], true) ? 'required' : 'nullable';
            $rules[$field] = [$presence, 'string', 'max:'.$limit];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'attachments.max' => 'Ajoutez au maximum trois fichiers.',
            'attachments.*.max' => 'Chaque fichier est limité à 2 Mo.',
            'attachments.*.uploaded' => 'Le fichier n’a pas pu être envoyé.',
            'attachments.*.mimes' => 'Choisissez un fichier PDF, PNG, JPG, DOCX, XLSX ou PPTX.',
            'attachments.*.extensions' => 'Choisissez un fichier PDF, PNG, JPG, DOCX, XLSX ou PPTX.',
        ];
    }
}
