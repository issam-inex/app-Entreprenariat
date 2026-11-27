<?php

use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['service' => 'StageLik']));
Route::get('/email/verify/{id}/{hash}', function (EmailVerificationRequest $request) {
    $request->fulfill();

    return redirect()->away(config('app.frontend_url').'/?email=confirmed#missions');
})->middleware(['auth', 'signed', 'throttle:6,1'])->name('verification.verify');
Route::get('/login', fn () => redirect()->away(config('app.frontend_url').'/#missions'))->name('login');
