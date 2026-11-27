<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SubmitMissionDelivery extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role === 'student' && $this->user()->hasVerifiedEmail();
    }

    public function rules(): array
    {
        return [
            'url' => 'required_without:attachment|nullable|url:http,https|max:2048',
            'attachment' => 'required_without:url|nullable|file|max:2048|extensions:pdf,png,jpg,jpeg,docx,xlsx,pptx|mimes:pdf,png,jpg,jpeg,docx,xlsx,pptx',
        ];
    }

    public function messages(): array
    {
        return [
            'url.required_without' => 'Ajoutez un lien ou une pièce jointe.',
            'url.url' => 'Le lien doit commencer par http:// ou https://.',
            'attachment.uploaded' => 'Le fichier ne peut pas être envoyé. La limite est de 2 Mo.',
            'attachment.max' => 'La pièce jointe est limitée à 2 Mo.',
            'attachment.mimes' => 'Formats acceptés : PDF, PNG, JPG, DOCX, XLSX et PPTX.',
            'attachment.extensions' => 'Formats acceptés : PDF, PNG, JPG, DOCX, XLSX et PPTX.',
        ];
    }
}
