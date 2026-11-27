<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class CompanyProfileService
{
    public function save(User $company, array $fields, ?UploadedFile $photo, bool $removePhoto): array
    {
        $uploaded = null;
        $disk = Storage::disk('local');

        try {
            [$previous, $current] = DB::transaction(function () use ($company, $fields, $photo, $removePhoto, &$uploaded): array {
                User::where('role', 'company')->lockForUpdate()->findOrFail($company->id);
                $profiles = DB::table('company_profiles');
                $previous = $profiles->where('user_id', $company->id)->value('photo_path');
                if ($photo) {
                    $uploaded = $photo->store('company-photos', 'local');
                    abort_unless($uploaded, 503, 'Impossible d’enregistrer la photo.');
                }
                $current = $photo || $removePhoto ? $uploaded : $previous;
                DB::table('company_profiles')->updateOrInsert(
                    ['user_id' => $company->id], [...$fields, 'photo_path' => $current],
                );

                return [$previous, $current];
            });
        } catch (Throwable $exception) {
            if ($uploaded) {
                $disk->delete($uploaded);
            }
            throw $exception;
        }
        if ($previous && $previous !== $current) {
            $disk->delete($previous);
        }

        return [...$fields, 'photo_path' => $current];
    }
}
