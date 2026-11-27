<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\ApplicationContactController;
use App\Http\Controllers\CompanyVerificationController;
use App\Http\Controllers\CompanyProfileController;
use App\Http\Controllers\MissionController;
use App\Http\Controllers\MissionAttachmentController;
use App\Http\Controllers\MissionWorkController;
use App\Http\Controllers\StudentProfileController;
use App\Http\Controllers\MissionBriefController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::get('auth/me', [AccountController::class, 'session']);
    Route::post('auth/register', [AccountController::class, 'register'])->middleware('throttle:10,1');
    Route::post('auth/login', [AccountController::class, 'login'])->middleware('throttle:10,1');
    Route::post('auth/password/forgot', [AccountController::class, 'forgot'])->middleware('throttle:5,1');
    Route::post('auth/password/reset', [AccountController::class, 'resetPassword'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::post('auth/logout', [AccountController::class, 'logout']);
        Route::post('auth/email/resend', [AccountController::class, 'resend'])->middleware('throttle:6,1');
        Route::get('student/profile', [StudentProfileController::class, 'show']);
        Route::patch('student/profile', [StudentProfileController::class, 'update']);
        Route::get('student/profile/photo', [StudentProfileController::class, 'photo']);
        Route::get('company/profile', [CompanyProfileController::class, 'show']);
        Route::put('company/profile', [CompanyProfileController::class, 'update']);
        Route::get('companies/{company}/photo', [CompanyProfileController::class, 'photo'])->whereNumber('company');
        Route::get('missions', [MissionController::class, 'index']);
        Route::get('missions/work', [MissionWorkController::class, 'index']);
        Route::get('missions/{mission}/attachments/{attachment}', MissionAttachmentController::class)->whereNumber(['mission', 'attachment']);
        Route::post('missions/{id}/delivery', [MissionWorkController::class, 'submit'])->whereNumber('id');
        Route::get('missions/{id}/delivery/attachment', [MissionWorkController::class, 'download'])->whereNumber('id');
        Route::post('missions/{id}/complete', [MissionWorkController::class, 'complete'])->whereNumber('id');
        Route::post('missions', [MissionController::class, 'store']);
        Route::post('missions/brief/extract', MissionBriefController::class)->middleware('throttle:5,1');
        Route::patch('missions/{id}', [MissionController::class, 'update'])->whereNumber('id');
        Route::delete('missions/{id}', [MissionController::class, 'destroy'])->whereNumber('id');
        Route::post('missions/{id}/publish', [MissionController::class, 'publish'])->whereNumber('id');
        Route::post('missions/{id}/release', [MissionController::class, 'release'])->whereNumber('id');
        Route::patch('missions/{id}/visibility', [MissionController::class, 'visibility'])->whereNumber('id');
        Route::post('missions/{id}/applications', [MissionController::class, 'apply'])->whereNumber('id');
        Route::post('missions/{id}/applications/{student}/accept', [MissionController::class, 'acceptApplication'])->whereNumber(['id', 'student']);
        Route::post('missions/{id}/applications/{student}/reject', [MissionController::class, 'rejectApplication'])->whereNumber(['id', 'student']);
        Route::get('missions/{mission}/applications/{student}/profile', [StudentProfileController::class, 'applicant'])->whereNumber(['mission', 'student']);
        Route::get('missions/{mission}/applications/{student}/profile/photo', [StudentProfileController::class, 'applicantPhoto'])->whereNumber(['mission', 'student']);
        Route::post('missions/{id}/applications/{student}/contact', ApplicationContactController::class)
            ->whereNumber(['id', 'student'])->middleware('throttle:10,1');
        Route::patch('missions/{id}/applications/me', [MissionController::class, 'updateApplication'])->whereNumber('id');
        Route::delete('missions/{id}/applications/me', [MissionController::class, 'withdrawApplication'])->whereNumber('id');
        Route::get('company/verifications', [CompanyVerificationController::class, 'mine']);
        Route::post('company/verifications', [CompanyVerificationController::class, 'store'])->middleware('throttle:10,1');
        Route::get('verification-documents/{verification}/download', [CompanyVerificationController::class, 'download']);
        Route::get('admin/verifications', [CompanyVerificationController::class, 'queue']);
        Route::get('admin/companies', [CompanyVerificationController::class, 'companies']);
        Route::get('admin/companies/{company}/verifications', [CompanyVerificationController::class, 'companyDossiers'])->whereNumber('company');
        Route::delete('admin/companies/{company}', [CompanyVerificationController::class, 'destroyCompany'])->whereNumber('company');
        Route::post('admin/verifications/{verification}/decisions', [CompanyVerificationController::class, 'decide']);
    });
});
