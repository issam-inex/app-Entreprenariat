<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveMission;
use App\Http\Requests\SaveApplication;
use App\Models\Mission;
use App\Models\MissionAttachment;
use App\Models\User;
use App\Services\SaveMissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class MissionController extends Controller
{
    private const APPLICATION_STATUS = "CASE WHEN a.rejected_at IS NOT NULL THEN 'rejected' WHEN m.selected_student_id = a.student_id THEN 'accepted' WHEN m.selected_student_id IS NOT NULL THEN 'not_selected' ELSE 'submitted' END AS status";

    public function index(Request $request): JsonResponse
    {
        $account = $request->user();
        $missions = DB::table('missions as m')->join('users as c', 'c.id', '=', 'm.company_id')
            ->select(['m.id', 'm.status', 'm.published_at', 'm.category', 'c.id as companyId', 'c.name as company', ...array_map(fn ($field) => 'm.'.$field, array_keys(Mission::FIELD_LIMITS))])
            ->orderByDesc('m.id');

        if ($account->role === 'company') {
            $missions->where('m.company_id', $account->id)->addSelect(['m.delivery_submitted_at', 'm.completed_at']);
            $applications = $account->status === 'verified' && $account->hasVerifiedEmail()
                ? DB::table('applications as a')->join('missions as m', 'm.id', '=', 'a.mission_id')
                    ->join('users as s', 's.id', '=', 'a.student_id')->where('m.company_id', $account->id)
                    ->leftJoin('student_profiles as sp', 'sp.user_id', '=', 's.id')
                    ->select(['a.mission_id as missionId', 'a.student_id as studentId', 's.name', 'a.message'])
                    ->selectRaw('CASE WHEN a.share_email = 1 AND s.email_verified_at IS NOT NULL THEN s.email END AS contact_email')
                    ->selectRaw('CASE WHEN sp.photo_path IS NULL THEN 0 ELSE 1 END AS has_photo')
                    ->selectRaw(self::APPLICATION_STATUS)
                    ->get()
                : [];
        } else {
            abort_unless($account->role === 'student', 403);
            $missions->whereIn('m.status', ['published', 'occupied'])->where('c.status', 'verified')
                ->whereNotNull('c.email_verified_at')->whereNull('m.completed_at');
            $applications = DB::table('applications as a')->join('missions as m', 'm.id', '=', 'a.mission_id')
                ->where('a.student_id', $account->id)->orderByDesc('m.id')
                ->select(['a.mission_id as missionId', 'a.message', 'a.share_email', 'm.title'])
                ->selectRaw(self::APPLICATION_STATUS)
                ->get();
        }

        $missions = $missions->get()->map(function ($mission) {
            if ($mission->published_at !== null) {
                $mission->published_at = Carbon::parse($mission->published_at, 'UTC')->toISOString();
            }

            return $mission;
        });

        $directory = $account->role === 'student'
            ? ['companies' => User::where('role', 'company')->where('status', 'verified')
                ->leftJoin('company_profiles as profile', 'profile.user_id', '=', 'users.id')
                ->whereNotNull('email_verified_at')->orderBy('users.name')->orderBy('users.id')
                ->get(['users.id', 'users.name', 'profile.city', 'profile.sector', 'profile.description', 'profile.website', 'profile.photo_path'])
                ->map(function (User $company): array {
                    $photo = $company->photo_path;

                    return $company->only(['id', 'name', 'city', 'sector', 'description', 'website']) + [
                        'photo_url' => $photo ? "/api/v1/companies/{$company->id}/photo?v=".hash('sha256', $photo) : null,
                    ];
                })]
            : [];

        return response()->json(['missions' => MissionAttachment::addMetadata($missions), 'applications' => $applications, ...$directory])
            ->header('Cache-Control', 'no-store');
    }

    public function store(SaveMission $request, SaveMissionService $service): JsonResponse
    {
        $mission = $service->save($request->user(), $request->validated());

        return response()->json(['id' => $mission->id, 'status' => 'draft'], 201);
    }

    public function update(SaveMission $request, int $id, SaveMissionService $service): JsonResponse
    {
        $service->save($request->user(), $request->validated(), $id);

        return response()->json((object) []);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $paths = DB::transaction(function () use ($request, $id): array {
            $company = User::lockForUpdate()->findOrFail($request->user()->id);
            $mission = Mission::where('company_id', $company->id)->lockForUpdate()->findOrFail($id);
            Gate::forUser($company)->authorize('delete', $mission);
            abort_if(DB::table('applications')->where('mission_id', $mission->id)->exists(), 409,
                'Cette mission a reçu des candidatures. Masquez-la pour conserver le suivi.');
            $paths = MissionAttachment::where('mission_id', $id)->pluck('path')->all();
            $mission->delete();

            return $paths;
        });
        Storage::disk('local')->delete($paths);

        return response()->json((object) []);
    }

    public function publish(Request $request, int $id): JsonResponse
    {
        DB::transaction(function () use ($request, $id): void {
            $company = User::lockForUpdate()->findOrFail($request->user()->id);
            $mission = Mission::where('company_id', $company->id)->lockForUpdate()->findOrFail($id);
            Gate::forUser($company)->authorize('publish', $mission);
            abort_unless($mission->status === 'draft', 409, 'Cette mission est déjà publiée.');
            $mission->forceFill(['status' => 'published', 'published_at' => now('UTC')->toDateTimeString()])->save();
        });

        return response()->json((object) []);
    }

    public function visibility(Request $request, int $id): JsonResponse
    {
        $request->validate(['visible' => 'required|boolean']);
        DB::transaction(function () use ($request, $id): void {
            $company = User::lockForUpdate()->findOrFail($request->user()->id);
            $mission = Mission::where('company_id', $company->id)->lockForUpdate()->findOrFail($id);
            Gate::forUser($company)->authorize('publish', $mission);
            abort_unless(in_array($mission->status, ['published', 'hidden'], true), 409, 'Publiez la mission avant de modifier sa visibilité.');
            $mission->forceFill(['status' => $request->boolean('visible') ? 'published' : 'hidden'])->save();
        });

        return response()->json((object) []);
    }

    public function apply(SaveApplication $request, int $id): JsonResponse
    {
        $mission = Mission::findOrFail($id);
        DB::transaction(function () use ($request, $mission): void {
            $company = User::lockForUpdate()->findOrFail($mission->company_id);
            $current = Mission::lockForUpdate()->findOrFail($mission->id);
            abort_unless($company->status === 'verified' && $company->hasVerifiedEmail(), 404, 'Mission introuvable.');
            abort_if($current->status === 'occupied', 409, 'Cette mission est déjà occupée.');
            abort_unless($current->status === 'published', 404, 'Mission introuvable.');
            DB::table('applications')->upsert(
                ['mission_id' => $current->id, 'student_id' => $request->user()->id,
                    'message' => $request->validated('message'), 'share_email' => $request->boolean('share_email')],
                ['mission_id', 'student_id'],
                ['student_id'],
            );
        });

        return response()->json((object) []);
    }

    public function acceptApplication(Request $request, int $id, int $student): JsonResponse
    {
        return $this->decideApplication($request, $id, $student, true);
    }

    public function rejectApplication(Request $request, int $id, int $student): JsonResponse
    {
        return $this->decideApplication($request, $id, $student, false);
    }

    private function decideApplication(Request $request, int $id, int $student, bool $accept): JsonResponse
    {
        DB::transaction(function () use ($request, $id, $student, $accept): void {
            $company = User::lockForUpdate()->findOrFail($request->user()->id);
            $mission = Mission::where('company_id', $company->id)->lockForUpdate()->findOrFail($id);
            Gate::forUser($company)->authorize('publish', $mission);
            abort_unless($mission->status === 'published', 409, 'La mission doit être publiée et disponible.');
            $application = DB::table('applications')->where('mission_id', $id)->where('student_id', $student);
            $candidate = $application->lockForUpdate()->first(['rejected_at']);
            abort_unless($candidate, 404, 'Candidature introuvable.');
            abort_if($candidate->rejected_at !== null, 409, 'Cette candidature a déjà été refusée.');
            if (! $accept) {
                $application->update(['rejected_at' => now('UTC')->toDateTimeString()]);

                return;
            }
            $mission->forceFill([
                'status' => 'occupied', 'selected_student_id' => $student, 'started_at' => now('UTC')->toDateTimeString(),
            ])->save();
        });

        return response()->json((object) []);
    }

    public function release(Request $request, int $id): JsonResponse
    {
        DB::transaction(function () use ($request, $id): void {
            $company = User::lockForUpdate()->findOrFail($request->user()->id);
            $mission = Mission::where('company_id', $company->id)->lockForUpdate()->findOrFail($id);
            Gate::forUser($company)->authorize('publish', $mission);
            abort_unless($mission->status === 'occupied', 409, 'Cette mission n’est pas occupée.');
            abort_if($mission->delivery_submitted_at !== null, 409, 'La mission ne peut plus être libérée après le dépôt d’un livrable.');
            $mission->forceFill(['status' => 'published', 'selected_student_id' => null, 'started_at' => null])->save();
        });

        return response()->json((object) []);
    }

    public function updateApplication(SaveApplication $request, int $id): JsonResponse
    {
        $application = DB::table('applications')->where('mission_id', $id)->where('student_id', $request->user()->id);
        abort_unless($application->exists(), 404, 'Candidature introuvable.');
        $application->update($request->safe()->only(['message', 'share_email']));

        return response()->json((object) []);
    }

    public function withdrawApplication(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()->role === 'student' && $request->user()->hasVerifiedEmail(), 403);
        DB::transaction(function () use ($request, $id): void {
            $mission = Mission::lockForUpdate()->findOrFail($id);
            $studentId = $request->user()->id;
            abort_if($mission->selected_student_id === $studentId, 409, 'Une candidature acceptée ne peut plus être retirée.');
            $application = DB::table('applications')->where('mission_id', $id)->where('student_id', $studentId);
            $candidate = $application->first(['rejected_at']);
            abort_unless($candidate, 404, 'Candidature introuvable.');
            abort_if($candidate->rejected_at !== null, 409, 'Une candidature refusée ne peut plus être retirée.');
            $application->delete();
        });

        return response()->json((object) []);
    }
}
