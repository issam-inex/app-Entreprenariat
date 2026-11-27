<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Mission extends Model
{
    public $timestamps = false;

    public const FIELD_LIMITS = [
        'title' => 180, 'description' => 4000, 'duration' => 100, 'skills' => 500,
        'objectives' => 2000, 'instructions' => 3000, 'deliverables' => 2000, 'evaluation_criteria' => 2000,
    ];

    public const CATEGORIES = ['development', 'design', 'data', 'content', 'other'];

    protected $fillable = [
        'title', 'description', 'duration', 'skills', 'objectives', 'instructions', 'deliverables', 'evaluation_criteria', 'category',
    ];

    protected $casts = ['selected_student_id' => 'integer'];
}
