<?php

namespace App\Http\Controllers;

use App\Models\MissionAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class MissionAttachmentController extends Controller
{
    public function __invoke(Request $request, int $mission, int $attachment): StreamedResponse
    {
        $account = $request->user();
        abort_unless(in_array($account->role, ['company', 'student'], true), 403);

        $files = MissionAttachment::query()->join('missions as m', 'mission_attachments.mission_id', '=', 'm.id')
            ->join('users as company', 'company.id', '=', 'm.company_id')->whereNull('company.deleted_at')
            ->where('m.id', $mission)->where('mission_attachments.id', $attachment);

        if ($account->role === 'company') {
            $files->where('m.company_id', $account->id);
        } else {
            $files->where('company.status', 'verified')->whereNotNull('company.email_verified_at')
                ->whereIn('m.status', ['published', 'occupied'])
                ->where(fn ($query) => $query->whereNull('m.completed_at')->orWhere('m.selected_student_id', $account->id));
        }

        $path = $files->value('mission_attachments.path');
        $disk = Storage::disk('local');
        abort_unless($path && $disk->exists($path), 404);

        return $disk->download($path, 'mission-'.$mission.'-'.$attachment.'.'.pathinfo($path, PATHINFO_EXTENSION), [
            'Cache-Control' => 'private, no-store',
            'Content-Type' => 'application/octet-stream',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
