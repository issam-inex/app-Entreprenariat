<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveStudentProfile;
use App\Models\Mission;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\StudentProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'student', 403);

        return $this->response(StudentProfile::find($request->user()->id) ?? new StudentProfile);
    }

    public function update(SaveStudentProfile $request, StudentProfileService $service): JsonResponse
    {
        $profile = $service->save($request->user(), $request->safe()->except(['photo', 'remove_photo']),
            $request->file('photo'), $request->boolean('remove_photo'));

        return $this->response($profile);
    }

    public function photo(Request $request): StreamedResponse
    {
        abort_unless($request->user()->role === 'student', 403);
        return $this->streamPhoto(StudentProfile::find($request->user()->id)?->photo_path);
    }

    public function applicant(Request $request, int $mission, int $student): JsonResponse
    {
        $candidate = $this->authorizedApplicant($request, $mission, $student);
        $profile = StudentProfile::find($candidate->id);

        return response()->json([
            'name' => $candidate->name,
            'bio' => $profile?->bio,
            'skills' => $profile?->skills,
            'links' => $profile?->links ?? [],
            'photo_url' => $profile?->photo_path ? "/api/v1/missions/$mission/applications/$student/profile/photo" : null,
        ])->header('Cache-Control', 'private, no-store');
    }

    public function applicantPhoto(Request $request, int $mission, int $student): StreamedResponse
    {
        $candidate = $this->authorizedApplicant($request, $mission, $student);

        return $this->streamPhoto(StudentProfile::find($candidate->id)?->photo_path);
    }

    private function authorizedApplicant(Request $request, int $id, int $student): User
    {
        $company = $request->user();
        abort_unless($company->role === 'company', 403);
        $mission = Mission::where('company_id', $company->id)->findOrFail($id);
        Gate::authorize('publish', $mission);
        abort_unless(DB::table('applications')->where('mission_id', $id)->where('student_id', $student)->exists(), 404);

        return User::where('role', 'student')->findOrFail($student);
    }

    private function streamPhoto(?string $path): StreamedResponse
    {
        $disk = Storage::disk('local');
        abort_unless($path && $disk->exists($path), 404);

        return $disk->response($path, null, [
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    private function response(StudentProfile $profile): JsonResponse
    {
        return response()->json([
            ...$profile->only(['bio', 'skills']),
            'links' => $profile->links ?? [],
            'complete' => filled($profile->bio) && filled($profile->skills),
            'photo_url' => $profile->photo_path ? '/api/v1/student/profile/photo?v='.hash('sha256', $profile->photo_path) : null,
        ])->header('Cache-Control', 'private, no-store');
    }
}
