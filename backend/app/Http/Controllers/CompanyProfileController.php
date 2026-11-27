<?php

namespace App\Http\Controllers;

use App\Http\Requests\SaveCompanyProfile;
use App\Models\User;
use App\Services\CompanyProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CompanyProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'company', 403);
        $profile = DB::table('company_profiles')->where('user_id', $request->user()->id)
            ->first(['city', 'sector', 'description', 'website', 'photo_path']);

        return $this->response($request->user()->id, (array) $profile);
    }

    public function update(SaveCompanyProfile $request, CompanyProfileService $service): JsonResponse
    {
        $profile = $service->save($request->user(), $request->safe()->except(['photo', 'remove_photo']),
            $request->file('photo'), $request->boolean('remove_photo'));

        return $this->response($request->user()->id, $profile);
    }

    public function photo(Request $request, int $company): StreamedResponse
    {
        $account = $request->user();
        $owner = User::where('role', 'company')->findOrFail($company);
        abort_unless($account->id === $owner->id || ($account->role === 'student'
            && $owner->status === 'verified' && $owner->hasVerifiedEmail()), 404);
        $path = DB::table('company_profiles')->where('user_id', $company)->value('photo_path');
        $disk = Storage::disk('local');
        abort_unless($path && $disk->exists($path), 404);

        return $disk->response($path, null, ['Cache-Control' => 'private, no-store', 'X-Content-Type-Options' => 'nosniff']);
    }

    private function response(int $company, array $profile): JsonResponse
    {
        $path = $profile['photo_path'] ?? null;
        unset($profile['photo_path']);
        $profile['photo_url'] = CompanyProfileService::photoUrl($company, $path);

        return response()->json($profile)->header('Cache-Control', 'private, no-store');
    }
}
