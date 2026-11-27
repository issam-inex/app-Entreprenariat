<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MissionBriefTest extends TestCase
{
    use RefreshDatabase;

    public function test_exhausted_api_credits_are_explained(): void
    {
        config(['services.openai.key' => 'fake-test-key']);
        Http::fake(['https://api.openai.com/v1/responses' => Http::response([
            'error' => ['type' => 'insufficient_quota', 'code' => 'credit_balance_exhausted'],
        ], 429)]);
        $company = User::factory()->create(['role' => 'company']);
        $this->actingAs($company)->postJson('/api/v1/missions/brief/extract', ['text' => 'Exemple.', 'consent' => true])
            ->assertStatus(503)
            ->assertJsonPath('message', 'Le projet OpenAI n’a pas de quota API disponible. Vérifiez sa facturation ou utilisez l’import local.');
    }

    public function test_only_a_company_can_extract_a_consented_brief_without_creating_a_mission(): void
    {
        config(['services.openai.key' => 'fake-test-key']);
        Http::fake(['https://api.openai.com/v1/responses' => Http::response([
            'status' => 'completed',
            'output' => [['type' => 'message', 'content' => [[
                'type' => 'output_text', 'text' => json_encode(['title' => 'Suivi des commandes', 'duration' => null, 'objectives' => str_repeat('a', 2001), 'role' => 'admin']),
            ]]]],
        ])]);
        $student = User::factory()->create(['role' => 'student']);
        $company = User::factory()->create(['role' => 'company', 'status' => 'pending']);
        $url = '/api/v1/missions/brief/extract';
        $text = 'Nous avons besoin d’un outil de suivi.';

        $this->actingAs($student)->postJson($url, ['text' => $text, 'consent' => true])->assertForbidden();
        $this->actingAs($company)->postJson($url, ['text' => $text])->assertUnprocessable();
        Http::assertNothingSent();
        $this->postJson($url, ['text' => $text, 'consent' => true])->assertOk()
            ->assertJsonPath('values.title', 'Suivi des commandes')
            ->assertJsonMissingPath('values.duration')
            ->assertJsonMissingPath('values.role')
            ->assertJsonPath('truncated.0', 'objectives');
        Http::assertSent(fn ($request) => $request['input'] === $text && $request['store'] === false);
        $this->assertDatabaseCount('missions', 0);
    }
}
