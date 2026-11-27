<?php

namespace App\Http\Controllers;

use App\Mail\ApplicationContact;
use App\Models\Mission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class ApplicationContactController extends Controller
{
    public function __invoke(Request $request, int $id, int $student): JsonResponse
    {
        $company = $request->user();
        $mission = Mission::where('company_id', $company->id)->findOrFail($id);
        Gate::authorize('publish', $mission);
        $input = $request->validate(['message' => 'required|string|max:2000']);
        $email = DB::table('applications as a')->join('users as s', 's.id', '=', 'a.student_id')
            ->where('a.mission_id', $mission->id)->where('a.student_id', $student)
            ->where('s.role', 'student')->whereNotNull('s.email_verified_at')->value('s.email');
        abort_unless($email, 404, 'Candidature introuvable.');
        abort_if(in_array(config('mail.default'), ['log', 'array'], true), 503,
            'Configurez l’envoi d’e-mails de StageLik pour contacter un étudiant.');

        try {
            Mail::to($email)->send(new ApplicationContact($company->name, $company->email, $mission->title, $input['message']));
        } catch (TransportExceptionInterface) {
            abort(503, 'Le service d’envoi d’e-mails est indisponible.');
        }

        return response()->json(['sent' => true]);
    }
}
