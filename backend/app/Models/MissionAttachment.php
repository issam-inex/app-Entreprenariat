<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class MissionAttachment extends Model
{
    public $timestamps = false;

    protected $fillable = ['mission_id', 'name', 'path'];

    public static function addMetadata(Collection $missions): Collection
    {
        $attachments = static::whereIn('mission_id', $missions->pluck('id'))->orderBy('id')
            ->get(['id', 'mission_id', 'name'])->groupBy('mission_id');
        foreach ($missions as $mission) {
            $mission->attachments = $attachments->get($mission->id, collect())
                ->map(fn (self $attachment) => $attachment->only(['id', 'name']))->values();
        }

        return $missions;
    }
}
