<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SaveApplication extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role === 'student' && $this->user()->hasVerifiedEmail();
    }

    public function rules(): array
    {
        return [
            'message' => 'nullable|string|max:2000',
            'share_email' => 'sometimes|boolean',
            'student_id' => 'prohibited',
            'mission_id' => 'prohibited',
        ];
    }
}
