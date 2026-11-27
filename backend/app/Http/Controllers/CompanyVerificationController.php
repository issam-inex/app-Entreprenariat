<?php

namespace App\Http\Controllers;

use App\Http\Requests\DecideCompanyVerification;
use App\Http\Requests\SubmitCompanyVerification;
use App\Http\Resources\CompanyVerificationResource;
use App\Models\CompanyVerification;
use App\Models\User;
use App\Services\CompanyVerificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CompanyVerificationController extends Controller
{
    public function mine(Request $request)
    {
        abort_unless($request->user()->role === 'company', 403);

        return CompanyVerificationResource::collection(
            CompanyVerification::where('company_id', $request->user()->id)->with('decisions')->latest('attempt')->paginate(20)
        )->response()->header('Cache-Control', 'no-store');
    }

    public function store(SubmitCompanyVerification $request, CompanyVerificationService $service)
    {
        return CompanyVerificationResource::make($service->submit(
            $request->user(), $request->safe()->except(['document', 'status', 'company_id']), $request->file('document')
        ))->response()->setStatusCode(201);
    }

    public function queue(Request $request)
    {
        Gate::authorize('review', CompanyVerification::class);
        $filters = $request->validate(['status' => 'sometimes|in:pending,verified,rejected,suspended']);
        $query = CompanyVerification::with('decisions')->addSelect([
            'latest_attempt' => DB::table('company_verifications as latest')->selectRaw('MAX(latest.attempt)')
                ->whereColumn('latest.company_id', 'company_verifications.company_id'),
        ])->latest('id');
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return CompanyVerificationResource::collection($query->paginate(20)->withQueryString())
            ->response()->header('Cache-Control', 'no-store');
    }

    public function companies(Request $request)
    {
        Gate::authorize('review', CompanyVerification::class);
        $filters = $request->validate(['status' => 'sometimes|in:pending,verified,rejected,suspended']);

        return response()->json(User::query()->where('role', 'company')
            ->when(isset($filters['status']), fn ($query) => $query->where('status', $filters['status']))
            ->orderBy('name')->orderBy('id')->paginate(20, ['id', 'name', 'status'])->withQueryString())
            ->header('Cache-Control', 'no-store');
    }

    public function companyDossiers(User $company)
    {
        Gate::authorize('review', CompanyVerification::class);
        abort_unless($company->role === 'company', 404);

        $dossiers = CompanyVerification::where('company_id', $company->id)->with('decisions')
            ->addSelect(['latest_attempt' => CompanyVerification::where('company_id', $company->id)->selectRaw('MAX(attempt)')])
            ->latest('attempt')->paginate(20);

        return CompanyVerificationResource::collection($dossiers)
            ->additional(['company' => $company->only(['id', 'name', 'status'])])
            ->response()->header('Cache-Control', 'no-store');
    }

    public function destroyCompany(Request $request, User $company)
    {
        Gate::authorize('review', CompanyVerification::class);
        DB::transaction(function () use ($company): void {
            $current = User::where('role', 'company')->lockForUpdate()->findOrFail($company->id);
            // Catalog queries using direct joins also exclude suspended companies.
            $current->forceFill(['status' => 'suspended'])->save();
            $current->deleteOrFail();
        });
        Log::notice('Compte entreprise supprimé.', ['company_id' => $company->id, 'admin_id' => $request->user()->id]);

        return response()->noContent();
    }

    public function decide(DecideCompanyVerification $request, CompanyVerification $verification, CompanyVerificationService $service)
    {
        return CompanyVerificationResource::make($service->decide($request->user(), $verification, $request->validated()))
            ->response()->setStatusCode(201);
    }

    public function download(Request $request, CompanyVerification $verification)
    {
        Gate::authorize('view', $verification);
        abort_unless(Storage::disk('local')->exists($verification->document_path), 404);
        DB::table('verification_document_accesses')->insert([
            'company_verification_id' => $verification->id, 'user_id' => $request->user()->id, 'created_at' => now(),
        ]);

        return Storage::disk('local')->download($verification->document_path, 'justificatif.pdf', [
            'Cache-Control' => 'no-store', 'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
