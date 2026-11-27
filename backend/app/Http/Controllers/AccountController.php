<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class AccountController extends Controller
{
    public function session(Request $request): JsonResponse
    {
        return response()->json([
            'account' => $request->user()?->only(['id', 'name', 'role', 'status', 'email_verified_at']),
        ])->header('Cache-Control', 'no-store');
    }

    public function register(Request $request): JsonResponse
    {
        abort_unless($request->hasSession(), 419);
        $input = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email:rfc|max:254',
            'role' => 'required|in:student,company',
            'password' => 'required|string|min:10|max:72',
            'status' => 'prohibited',
        ], [
            'password.min' => 'Choisissez un mot de passe d’au moins 10 caractères.',
        ]);
        abort_if(strlen($input['password']) > 72, 422, 'Choisissez un mot de passe de 72 octets maximum.');

        $account = new User([
            'name' => $input['name'],
            'email' => strtolower($input['email']),
            'password' => Hash::make($input['password']),
        ]);
        $account->role = $input['role'];
        $account->status = $input['role'] === 'company' ? 'pending' : 'approved';
        try {
            $account->save();
        } catch (UniqueConstraintViolationException) {
            abort(409, 'Cette adresse e-mail est déjà utilisée.');
        }

        Auth::login($account);
        $request->session()->regenerate();
        event(new Registered($account));

        return $this->session($request);
    }

    public function login(Request $request): JsonResponse
    {
        abort_unless($request->hasSession(), 419);
        $input = $request->validate([
            'email' => 'required|email:rfc|max:254',
            'password' => 'required|string|max:72',
        ]);
        $input['email'] = strtolower($input['email']);
        abort_unless(strlen($input['password']) <= 72 && Auth::attempt($input), 401, 'Adresse e-mail ou mot de passe incorrect.');
        $request->session()->regenerate();

        return $this->session($request);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['account' => null])->header('Cache-Control', 'no-store');
    }

    public function resend(Request $request): JsonResponse
    {
        if (! $request->user()->hasVerifiedEmail()) {
            $request->user()->sendEmailVerificationNotification();
        }

        return response()->json([], 202);
    }

    public function forgot(Request $request): JsonResponse
    {
        abort_unless($request->hasSession(), 419);
        $input = $request->validate(['email' => 'required|email:rfc|max:254']);
        ResetPassword::createUrlUsing(fn ($account, string $token) => config('app.frontend_url').'/#reinitialiser?'.http_build_query([
            'token' => $token, 'email' => $account->email,
        ]));
        Password::sendResetLink(['email' => strtolower($input['email'])]);

        return response()->json([], 202);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        abort_unless($request->hasSession(), 419);
        $input = $request->validate([
            'email' => 'required|email:rfc|max:254',
            'token' => 'required|string|max:255',
            'password' => 'required|string|min:10|max:72|confirmed',
        ]);
        abort_if(strlen($input['password']) > 72, 422, 'Mot de passe trop long.');
        $input['email'] = strtolower($input['email']);
        $result = Password::reset($input, function (User $account, string $password) use ($request): void {
            DB::transaction(function () use ($account, $password): void {
                $account->forceFill(['password' => Hash::make($password), 'remember_token' => null])->save();
                DB::table('sessions')->where('user_id', $account->id)->delete();
            });
            if ($request->user()?->id === $account->id) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }
        });
        abort_unless($result === Password::PASSWORD_RESET, 422, 'Lien de réinitialisation invalide ou expiré.');

        return response()->json([]);
    }
}
