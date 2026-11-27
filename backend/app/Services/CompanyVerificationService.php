<?php

namespace App\Services;

use App\Models\CompanyVerification;
use App\Models\User;
use App\Notifications\CompanyVerificationDecided;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class CompanyVerificationService
{
    public function submit(User $user, array $details, UploadedFile $document): CompanyVerification
    {
        $path = $document->store('company-verifications', 'local');
        abort_unless($path, 503, 'Le justificatif n’a pas pu être enregistré.');

        try {
            return DB::transaction(function () use ($user, $details, $path) {
                $company = User::lockForUpdate()->findOrFail($user->id);
                $previous = CompanyVerification::where('company_id', $company->id)->latest('attempt')->first();
                abort_unless(in_array($company->status, ['pending', 'rejected'], true)
                    && (! $previous || $previous->status === 'rejected'), 409, 'Un dossier est déjà en cours ou validé.');
                $verification = CompanyVerification::create($details + [
                    'company_id' => $company->id,
                    'attempt' => ($previous?->attempt ?? 0) + 1,
                    'document_path' => $path,
                    'professional_email' => $company->email,
                    'status' => 'pending',
                ]);
                $company->forceFill(['status' => 'pending'])->save();

                return $verification;
            });
        } catch (Throwable $failure) {
            Storage::disk('local')->delete($path);
            throw $failure;
        }
    }

    public function decide(User $admin, CompanyVerification $verification, array $decision): CompanyVerification
    {
        return DB::transaction(function () use ($admin, $verification, $decision) {
            $company = User::lockForUpdate()->findOrFail($verification->company_id);
            $latest = CompanyVerification::where('company_id', $company->id)->latest('attempt')->lockForUpdate()->firstOrFail();
            abort_unless($latest->id === $verification->id, 409, 'Ce dossier a été remplacé.');
            $verification = $latest;
            abort_unless($company->status === $decision['expected_status'] && $verification->status === $company->status,
                409, 'Le statut a changé. Actualisez le dossier avant de prendre une décision.');
            $target = $decision['status'];
            $allowed = match ($company->status) {
                'pending' => ['verified', 'rejected'],
                'verified' => ['rejected', 'suspended'],
                'rejected' => ['verified'],
                'suspended' => ['pending'],
                default => [],
            };
            abort_unless(in_array($target, $allowed, true), 409, 'Cette transition n’est plus disponible.');
            if ($target === 'verified') {
                abort_unless($company->hasVerifiedEmail() && $company->email === $verification->professional_email, 409, 'Le courriel du dossier doit être confirmé.');
            }
            $verification->decisions()->create([
                'admin_id' => $admin->id,
                'status' => $target,
                'reason' => $decision['reason'],
                'legal_checked' => $decision['legal_checked'] ?? false,
                'representative_checked' => $decision['representative_checked'] ?? false,
            ]);
            $verification->update(['status' => $target]);
            $company->forceFill(['status' => $target])->save();
            DB::afterCommit(fn () => $company->notify(new CompanyVerificationDecided($target, $decision['reason'])));

            return $verification->load('decisions');
        });
    }
}
