<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class StudentProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_can_complete_profile_and_replace_or_remove_a_private_photo(): void
    {
        Storage::fake('local');
        $student = User::factory()->create(['role' => 'student']);
        $other = User::factory()->create(['role' => 'student']);
        $company = User::factory()->create(['role' => 'company', 'status' => 'verified']);
        $profile = '/api/v1/student/profile';
        $photo = "$profile/photo";
        $headers = ['Accept' => 'application/json'];
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBXsAAAAASUVORK5CYII=');
        $file = UploadedFile::fake()->createWithContent('portrait.png', $png);

        $this->getJson($profile)->assertUnauthorized();
        $this->actingAs($company)->getJson($profile)->assertForbidden();
        $this->patchJson($profile, ['bio' => 'Profil entreprise'])->assertForbidden();
        $this->actingAs($student)->getJson($profile)->assertJsonPath('complete', false);
        $this->patchJson($profile, ['links' => [['name' => 'GitHub', 'url' => 'javascript:alert(1)']]])->assertUnprocessable();
        $links = [['name' => 'GitHub', 'url' => 'https://github.com/example'], ['name' => 'Behance', 'url' => 'https://www.behance.net/example']];
        $this->post($profile, ['_method' => 'PATCH', 'photo' => $file, 'bio' => 'Étudiant en design',
            'skills' => 'Illustration, Figma', 'links' => json_encode($links)], $headers)
            ->assertOk()->assertJsonPath('complete', true)->assertJsonPath('links', $links)->assertJsonMissingPath('photo_path');
        $this->get($photo)->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->actingAs($other)->getJson($photo)->assertNotFound();
        $this->getJson($profile)->assertJsonPath('complete', false);
        $mission = $this->actingAs($company)->postJson('/api/v1/missions', [
            'title' => 'Illustration', 'description' => 'Créer une affiche', 'duration' => '1 semaine', 'skills' => 'Design',
        ])->assertCreated()->json('id');
        $this->postJson("/api/v1/missions/$mission/publish")->assertOk();
        $candidate = "/api/v1/missions/$mission/applications/{$student->id}/profile";
        $this->getJson($candidate)->assertNotFound();
        $this->actingAs($student)->postJson("/api/v1/missions/$mission/applications")->assertOk();
        $this->getJson($candidate)->assertForbidden();
        $this->actingAs($company)->getJson($candidate)->assertOk()
            ->assertJsonPath('bio', 'Étudiant en design')->assertJsonPath('links', $links)->assertJsonMissingPath('email');
        $this->get("$candidate/photo")->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->postJson("/api/v1/missions/$mission/applications/{$student->id}/accept")->assertOk();
        $this->getJson('/api/v1/missions/work')->assertJsonPath('missions.0.student_photo_url', "$candidate/photo")
            ->assertJsonMissingPath('missions.0.student_has_photo');
        $unrelated = User::factory()->create(['role' => 'company', 'status' => 'verified']);
        $this->actingAs($unrelated)->getJson("$candidate/photo")->assertNotFound();
        $this->getJson('/api/v1/missions/work')->assertJsonCount(0, 'missions');
        $company->forceFill(['status' => 'suspended'])->save();
        $this->actingAs($company)->getJson($candidate)->assertForbidden();
        $replacement = UploadedFile::fake()->createWithContent('portrait-2.png', $png);
        $this->actingAs($student)->post($profile, ['_method' => 'PATCH', 'photo' => $replacement], $headers)->assertOk();
        Storage::disk('local')->assertMissing('student-photos/'.$file->hashName());
        $this->patchJson($profile, ['remove_photo' => true])->assertOk()->assertJsonPath('photo_url', null)
            ->assertJsonPath('skills', 'Illustration, Figma');
        Storage::disk('local')->assertMissing('student-photos/'.$replacement->hashName());
        $this->getJson($photo)->assertNotFound();
        $this->patchJson($profile, ['links' => []])->assertOk()->assertJsonPath('links', []);
        $this->getJson($profile)->assertJsonPath('links', []);
    }
}
