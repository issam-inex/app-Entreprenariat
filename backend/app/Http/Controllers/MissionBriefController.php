<?php

namespace App\Http\Controllers;

use App\Models\Mission;
use App\Services\MissionBriefExtractor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class MissionBriefController extends Controller
{
    public function __invoke(Request $request, MissionBriefExtractor $extractor): JsonResponse
    {
        Gate::authorize('create', Mission::class);
        $input = $request->validate([
            'text' => 'required|string|max:24000',
            'consent' => 'required|accepted',
        ]);

        return response()->json($extractor->extract($input['text']))->header('Cache-Control', 'no-store');
    }
}
