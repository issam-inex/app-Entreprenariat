<?php

namespace App\Services;

use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class StudentProfileService
{
    public function save(User $student, array $fields, ?UploadedFile $photo, bool $removePhoto): StudentProfile
    {
        $disk = Storage::disk('local');
        $uploaded = null;

        try {
            [$profile, $previous] = DB::transaction(function () use ($student, $fields, $photo, $removePhoto, &$uploaded) {
                User::where('role', 'student')->lockForUpdate()->findOrFail($student->id);
                $profile = StudentProfile::find($student->id) ?? (new StudentProfile)->forceFill(['user_id' => $student->id]);
                $previous = $profile->photo_path;
                if ($photo) {
                    $uploaded = $photo->store('student-photos', 'local');
                    abort_unless($uploaded, 503, 'Impossible d’enregistrer la photo.');
                }
                if ($photo || $removePhoto) {
                    $profile->photo_path = $uploaded;
                }
                $profile->fill($fields)->save();

                return [$profile, $previous];
            });
        } catch (Throwable $exception) {
            if ($uploaded) {
                $disk->delete($uploaded);
            }
            throw $exception;
        }
        if ($previous && $previous !== $profile->photo_path) {
            $disk->delete($previous);
        }

        return $profile;
    }
}
