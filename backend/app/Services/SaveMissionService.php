<?php

namespace App\Services;

use App\Models\Mission;
use App\Models\MissionAttachment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class SaveMissionService
{
    public function save(User $account, array $input, ?int $id = null): Mission
    {
        $files = $input['attachments'] ?? [];
        $removeIds = $input['remove_attachments'] ?? [];
        unset($input['attachments'], $input['remove_attachments']);
        $written = [];
        $disk = Storage::disk('local');

        try {
            [$mission, $removedPaths] = DB::transaction(function () use ($account, $input, $id, $files, $removeIds, &$written): array {
                $company = User::lockForUpdate()->findOrFail($account->id);
                if ($id === null) {
                    Gate::forUser($company)->authorize('create', Mission::class);
                    $mission = new Mission;
                    $mission->forceFill(['company_id' => $company->id, 'status' => 'draft']);
                } else {
                    $mission = Mission::where('company_id', $company->id)->lockForUpdate()->findOrFail($id);
                    Gate::forUser($company)->authorize('update', $mission);
                    abort_if($mission->status !== 'draft' && DB::table('applications')->where('mission_id', $id)->exists(),
                        409, 'Une candidature a déjà été reçue. La mission ne peut plus être modifiée.');
                }

                $existing = $id === null ? collect() : MissionAttachment::where('mission_id', $id)->get();
                $removed = $existing->whereIn('id', $removeIds);
                if ($removed->count() !== count($removeIds)) {
                    throw ValidationException::withMessages(['attachments' => 'Une pièce à retirer ne fait pas partie de cette mission.']);
                }
                if ($existing->count() - $removed->count() + count($files) > 3) {
                    throw ValidationException::withMessages(['attachments' => 'Une mission peut contenir au maximum trois pièces jointes.']);
                }

                $mission->fill($input)->save();
                foreach ($files as $file) {
                    $path = $file->store('mission-attachments', 'local');
                    abort_unless($path, 503, 'Le stockage des fichiers est momentanément indisponible.');
                    $written[] = $path;
                    MissionAttachment::create([
                        'mission_id' => $mission->id,
                        'name' => Str::limit($file->getClientOriginalName(), 245),
                        'path' => $path,
                    ]);
                }
                if ($removed->isNotEmpty()) {
                    MissionAttachment::where('mission_id', $mission->id)->whereIn('id', $removed->pluck('id'))->delete();
                }

                return [$mission, $removed->pluck('path')->all()];
            });
        } catch (Throwable $exception) {
            $disk->delete($written);
            throw $exception;
        }
        $disk->delete($removedPaths);

        return $mission;
    }
}
