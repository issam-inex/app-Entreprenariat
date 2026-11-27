<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubmitMissionDelivery;
use App\Models\Mission;
use App\Models\MissionAttachment;
use App\Models\User;
use App\Services\CompanyProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class MissionWorkController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless(in_array($user->role, ['student', 'company'], true) && $user->hasVerifiedEmail(), 403);

        $query = DB::table('missions as m')->join('users as company', 'company.id', '=', 'm.company_id')
            ->where('m.status', 'occupied')->where('company.status', 'verified')->whereNotNull('company.email_verified_at')
            ->select(['m.id', 'm.title', 'm.description', 'm.duration', 'm.objectives', 'm.instructions', 'm.deliverables',
                'm.evaluation_criteria', 'm.delivery_url', 'm.started_at', 'm.delivery_submitted_at', 'm.completed_at',
                'm.delivery_link_reported_at', 'company.name as company'])
            ->selectRaw('CASE WHEN m.delivery_attachment_path IS NULL THEN 0 ELSE 1 END AS has_attachment')
            ->selectRaw("CASE WHEN m.delivery_scan_status = 'blocked' THEN 1 ELSE 0 END AS attachment_blocked")
            ->orderByDesc('m.id');
        if ($user->role === 'company') {
            $query->where('m.company_id', $user->id)->join('users as student', 'student.id', '=', 'm.selected_student_id')
                ->addSelect('student.name as student');
        } else {
            $query->where('m.selected_student_id', $user->id)
                ->leftJoin('company_profiles as profile', 'profile.user_id', '=', 'company.id')
                ->addSelect(['company.id as company_id', 'profile.photo_path as company_photo_path']);
        }

        $missions = $query->get()->map(function ($mission) {
            if (isset($mission->company_id)) {
                $mission->company_photo_url = CompanyProfileService::photoUrl($mission->company_id, $mission->company_photo_path);
                unset($mission->company_id, $mission->company_photo_path);
            }
            $mission->has_attachment = (bool) $mission->has_attachment;
            $mission->attachment_blocked = (bool) $mission->attachment_blocked;
            $mission->link_reported = $mission->delivery_link_reported_at !== null;
            unset($mission->delivery_link_reported_at);
            if ($mission->link_reported) {
                $mission->delivery_url = null;
            }
            foreach (['started_at', 'delivery_submitted_at', 'completed_at'] as $field) {
                $mission->{$field} = $mission->{$field} ? Carbon::parse($mission->{$field}, 'UTC')->toISOString() : null;
            }

            return $mission;
        });

        return response()->json(['missions' => MissionAttachment::addMetadata($missions)])->header('Cache-Control', 'no-store');
    }

    public function submit(SubmitMissionDelivery $request, int $id): JsonResponse
    {
        $student = $request->user();
        $input = $request->validated();
        $attachment = $request->file('attachment');
        $original = Mission::where('selected_student_id', $student->id)->findOrFail($id);
        $path = null;

        try {
            $previousPath = DB::transaction(function () use ($original, $student, $input, $attachment, &$path): ?string {
                $company = User::lockForUpdate()->findOrFail($original->company_id);
                $mission = Mission::where('selected_student_id', $student->id)->lockForUpdate()->findOrFail($original->id);
                abort_unless($company->status === 'verified' && $company->hasVerifiedEmail() && $mission->status === 'occupied', 404);
                $canReplace = $mission->completed_at === null && (
                    $mission->delivery_scan_status === 'blocked' || $mission->delivery_link_reported_at !== null
                );
                abort_if($mission->delivery_submitted_at !== null && ! $canReplace, 409, 'Un livrable a déjà été soumis pour cette mission.');
                $previousPath = $mission->delivery_attachment_path;
                if ($attachment) {
                    $path = $attachment->store('mission-deliveries', 'local');
                    abort_unless($path, 503, 'Le stockage est momentanément indisponible.');
                }
                $mission->forceFill([
                    'delivery_url' => $input['url'] ?? null,
                    'delivery_attachment_path' => $path,
                    'delivery_scan_status' => null,
                    'delivery_link_reported_at' => null,
                    'delivery_submitted_at' => now('UTC')->toDateTimeString(),
                ])->save();
                return $previousPath;
            });
        } catch (Throwable $exception) {
            if ($path) {
                Storage::disk('local')->delete($path);
            }

            throw $exception;
        }

        if ($previousPath) {
            Storage::disk('local')->delete($previousPath);
        }

        return response()->json((object) []);
    }

    public function download(Request $request, int $id): StreamedResponse
    {
        $user = $request->user();
        abort_unless(in_array($user->role, ['student', 'company'], true) && $user->hasVerifiedEmail(), 403);
        $participantColumn = $user->role === 'student' ? 'm.selected_student_id' : 'm.company_id';
        $mission = DB::table('missions as m')->join('users as company', 'company.id', '=', 'm.company_id')
            ->where('m.id', $id)->where($participantColumn, $user->id)->where('m.status', 'occupied')
            ->where('company.status', 'verified')->whereNotNull('company.email_verified_at')
            ->where(fn ($query) => $query->whereNull('m.delivery_scan_status')->orWhere('m.delivery_scan_status', '!=', 'blocked'))
            ->first(['m.delivery_attachment_path']);
        $path = $mission?->delivery_attachment_path;
        $disk = Storage::disk('local');
        abort_unless($path && $disk->exists($path), 404);

        return $disk->download($path, 'livrable-'.$id.'.'.pathinfo($path, PATHINFO_EXTENSION), [
            'Cache-Control' => 'private, no-store',
            'Content-Type' => 'application/octet-stream',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function complete(Request $request, int $id): JsonResponse
    {
        DB::transaction(function () use ($request, $id): void {
            $company = User::lockForUpdate()->findOrFail($request->user()->id);
            $mission = Mission::where('company_id', $company->id)->lockForUpdate()->findOrFail($id);
            Gate::forUser($company)->authorize('publish', $mission);
            abort_unless($mission->status === 'occupied' && $mission->delivery_submitted_at !== null && $mission->completed_at === null,
                409, 'Seule une mission avec un livrable à valider peut être terminée.');
            abort_if($mission->delivery_scan_status === 'blocked' || $mission->delivery_link_reported_at !== null,
                409, 'Le livrable doit être disponible avant de valider la mission.');
            $mission->forceFill(['completed_at' => now('UTC')->toDateTimeString()])->save();
        });

        return response()->json((object) []);
    }
}
