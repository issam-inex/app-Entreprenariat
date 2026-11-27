<?php

namespace Tests\Feature;

use App\Mail\ApplicationContact;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CompanyVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_company_profile_is_only_listed_after_verification(): void
    {
        Storage::fake('local');
        $company = User::factory()->create(['role' => 'company', 'status' => 'pending']);
        $student = User::factory()->create(['role' => 'student']);
        $path = '/api/v1/company/profile';
        $profile = ['city' => 'Rabat', 'sector' => 'Design', 'description' => 'Studio créatif', 'website' => 'https://example.test'];
        $this->actingAs($student)->putJson($path, $profile)->assertForbidden();
        $this->actingAs($company)->putJson($path, [...$profile, 'website' => 'javascript:alert(1)'])->assertUnprocessable();
        $this->putJson($path, $profile)->assertOk();
        $this->getJson($path)->assertExactJson([...$profile, 'photo_url' => null]);
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBXsAAAAASUVORK5CYII=');
        $file = UploadedFile::fake()->createWithContent('logo.png', $png);
        $photo = "/api/v1/companies/{$company->id}/photo";
        $photoUrl = $this->post($path, [...$profile, '_method' => 'PUT', 'photo' => $file], ['Accept' => 'application/json'])
            ->assertOk()->assertJsonMissingPath('photo_path')->json('photo_url');
        $this->get($photo)->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->actingAs($student)->getJson('/api/v1/missions')->assertJsonCount(0, 'companies');
        $this->getJson($photo)->assertNotFound();
        $company->forceFill(['status' => 'verified'])->save();
        $this->getJson('/api/v1/missions')->assertJsonPath('companies.0.city', 'Rabat')->assertJsonMissingPath('companies.0.email')
            ->assertJsonPath('companies.0.photo_url', $photoUrl)->assertJsonMissingPath('companies.0.photo_path');
        $this->get($photo)->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->actingAs($company)->putJson($path, [...$profile, 'remove_photo' => true])->assertOk()->assertJsonPath('photo_url', null);
        Storage::disk('local')->assertMissing('company-photos/'.$file->hashName());
    }

    public function test_mission_attachments_follow_mission_visibility_and_can_be_replaced(): void
    {
        Storage::fake('local');
        $company = User::factory()->create(['role' => 'company', 'status' => 'verified']);
        $other = User::factory()->create(['role' => 'company', 'status' => 'verified']);
        $student = User::factory()->create(['role' => 'student']);
        $details = ['title' => 'Mission', 'description' => 'Description', 'duration' => '1 semaine', 'skills' => 'Design'];
        $headers = ['Accept' => 'application/json'];
        $file = UploadedFile::fake()->create('consignes.pdf', 8, 'application/pdf');
        $id = $this->actingAs($company)->post('/api/v1/missions', [...$details, 'attachments' => [$file]], $headers)
            ->assertCreated()->json('id');
        $attachment = $this->getJson('/api/v1/missions')->assertJsonPath('missions.0.attachments.0.name', 'consignes.pdf')
            ->assertJsonMissingPath('missions.0.attachments.0.path')->json('missions.0.attachments.0.id');
        $mission = "/api/v1/missions/$id";
        $download = "$mission/attachments/$attachment";
        $this->get($download)->assertDownload("mission-$id-$attachment.pdf");
        $this->actingAs($student)->getJson($download)->assertNotFound();
        $this->actingAs($other)->getJson($download)->assertNotFound();
        $this->actingAs($company)->postJson("$mission/publish")->assertOk();
        $this->actingAs($student)->get($download)->assertDownload("mission-$id-$attachment.pdf");
        $this->actingAs($company)->patchJson("$mission/visibility", ['visible' => false])->assertOk();
        $this->actingAs($student)->getJson($download)->assertNotFound();
        $replacement = UploadedFile::fake()->create('annexe.pdf', 8, 'application/pdf');
        $this->actingAs($company)->post($mission, [
            ...$details, '_method' => 'PATCH', 'attachments' => [$replacement], 'remove_attachments' => [$attachment],
        ], $headers)->assertOk();
        $this->getJson($download)->assertNotFound();
        Storage::disk('local')->assertMissing('mission-attachments/'.$file->hashName());
        Storage::disk('local')->assertExists('mission-attachments/'.$replacement->hashName());
        $this->deleteJson($mission)->assertOk();
        Storage::disk('local')->assertMissing('mission-attachments/'.$replacement->hashName());
    }

    public function test_rejected_company_can_resubmit_but_cannot_override_its_status(): void
    {
        Storage::fake('local');
        Notification::fake();
        $company = User::factory()->create(['role' => 'company', 'status' => 'pending']);
        $admin = User::factory()->create(['role' => 'admin']);
        $uri = '/api/v1/company/verifications';
        $headers = ['Accept' => 'application/json'];
        $fields = [
            'legal_name' => 'Alpha', 'ice' => '123456789012345', 'commerce_register' => '123',
            'registration_city' => 'Casablanca', 'representative_name' => 'Représentant Alpha',
            'representative_position' => 'Gérant',
        ];
        $pdf = fn () => UploadedFile::fake()->create('justificatif.pdf', 10, 'application/pdf');

        $this->actingAs($company)->post($uri, [...$fields, 'document' => $pdf(), 'status' => 'verified'], $headers)
            ->assertUnprocessable();
        $this->post($uri, [
            ...$fields, 'document' => UploadedFile::fake()->create('justificatif.txt', 10, 'text/plain'),
        ], $headers)->assertUnprocessable();
        $first = $this->post($uri, [...$fields, 'document' => $pdf()], $headers)->assertCreated()->json('data.id');
        $this->post($uri, [...$fields, 'document' => $pdf()], $headers)->assertConflict();
        $this->actingAs($admin)->postJson("/api/v1/admin/verifications/{$first}/decisions", [
            'status' => 'rejected', 'expected_status' => 'pending', 'reason' => 'Compléter le justificatif.',
        ])->assertCreated();
        $this->actingAs($company->fresh())->post($uri, [...$fields, 'document' => $pdf()], $headers)
            ->assertCreated()->assertJsonPath('data.attempt', 2);
        $this->getJson($uri)->assertJsonPath('data.0.status', 'pending')->assertJsonPath('data.1.status', 'rejected');
        $this->assertDatabaseCount('verification_decisions', 1);
        $this->actingAs($admin)->getJson('/api/v1/admin/verifications?status=rejected')
            ->assertJsonPath('data.0.is_current', false);
    }

    public function test_company_access_depends_on_the_current_verification_decision(): void
    {
        Storage::fake('local');
        Notification::fake();
        $company = User::factory()->create(['role' => 'company', 'status' => 'pending']);
        $other = User::factory()->create(['role' => 'company', 'status' => 'pending']);
        $admin = User::factory()->create(['role' => 'admin']);
        $student = User::factory()->create(['role' => 'student']);

        $this->actingAs($company)->postJson('/api/v1/missions', [
            'title' => 'Mission', 'description' => 'Description', 'duration' => '2 semaines', 'skills' => 'React',
            'status' => 'published',
        ])->assertUnprocessable();
        $mission = $this->postJson('/api/v1/missions', [
            'title' => 'Mission', 'description' => 'Description', 'duration' => '2 semaines', 'skills' => 'React',
            'category' => 'design',
        ])->assertCreated()->json('id');
        $this->patchJson("/api/v1/missions/{$mission}", [
            'title' => 'Mission', 'description' => 'Description', 'duration' => '2 semaines', 'skills' => 'React',
            'category' => 'invalide',
        ])->assertUnprocessable();
        $this->getJson('/api/v1/missions')->assertJsonPath('missions.0.category', 'design');
        $this->postJson("/api/v1/missions/{$mission}/publish")->assertForbidden();
        $this->actingAs($student)->getJson('/api/v1/missions')->assertJsonCount(0, 'missions');
        $this->postJson('/api/v1/company/verifications')->assertForbidden();

        $fields = [
            'legal_name' => 'Entreprise Alpha', 'ice' => '123456789012345', 'commerce_register' => '123',
            'registration_city' => 'Casablanca', 'representative_name' => 'Représentant Alpha',
            'representative_position' => 'Gérant',
        ];
        $unverified = User::factory()->unverified()->create(['role' => 'company', 'status' => 'pending']);
        $this->actingAs($unverified)->post('/api/v1/company/verifications', $fields, ['Accept' => 'application/json'])->assertForbidden();
        $dossier = $this->actingAs($company)->post('/api/v1/company/verifications', [
            ...$fields, 'document' => UploadedFile::fake()->create('justificatif.pdf', 10, 'application/pdf'),
        ], ['Accept' => 'application/json'])->assertCreated()->assertJsonMissingPath('data.document_path')->json('data.id');

        $decision = "/api/v1/admin/verifications/{$dossier}/decisions";
        $companies = '/api/v1/admin/companies';
        $details = "$companies/{$company->id}/verifications";
        $this->getJson($companies)->assertForbidden();
        $this->actingAs($student)->getJson($details)->assertForbidden();
        $this->actingAs($admin)->getJson($companies)->assertOk()
            ->assertJsonFragment(['id' => $unverified->id, 'name' => $unverified->name, 'status' => 'pending'])
            ->assertJsonMissingPath('data.0.email')->assertJsonMissingPath('data.0.ice');
        $this->getJson("$companies/{$unverified->id}/verifications")->assertOk()->assertJsonCount(0, 'data');
        $this->getJson($details)->assertOk()->assertJsonPath('data.0.id', $dossier)->assertJsonPath('data.0.is_current', true);
        $this->actingAs($company);
        $document = "/api/v1/verification-documents/{$dossier}/download";
        $approval = ['status' => 'verified', 'expected_status' => 'pending', 'reason' => 'Pièces concordantes', 'legal_checked' => true, 'representative_checked' => true];
        $this->postJson($decision, $approval)->assertForbidden();
        $this->actingAs($other)->getJson($document)->assertForbidden();
        $this->actingAs($admin)->get($document)->assertDownload('justificatif.pdf');
        $this->postJson($decision, [...$approval, 'legal_checked' => false])->assertUnprocessable();
        $this->postJson($decision, $approval)->assertCreated();
        $this->getJson("$companies?status=verified")->assertOk()->assertJsonFragment(['id' => $company->id, 'status' => 'verified']);
        $this->postJson($decision, $approval)->assertConflict();
        $this->actingAs($company->fresh())->postJson("/api/v1/missions/{$mission}/publish")->assertOk();
        $publishedAt = $this->getJson('/api/v1/missions')->assertOk()->json('missions.0.published_at');
        $this->assertNotNull($publishedAt);
        $this->actingAs($student)->postJson("/api/v1/missions/{$mission}/applications")->assertOk();
        $this->postJson("/api/v1/missions/{$mission}/applications")->assertOk();
        $this->assertDatabaseCount('applications', 1);
        $this->actingAs($company->fresh())->getJson('/api/v1/missions')
            ->assertJsonPath('applications.0.contact_email', null);
        $sharing = "/api/v1/missions/{$mission}/applications/me";
        $this->actingAs($student)->patchJson($sharing, ['share_email' => true])->assertOk();
        $this->actingAs($company->fresh())->getJson('/api/v1/missions')
            ->assertJsonPath('applications.0.contact_email', $student->email);
        $this->actingAs($other)->getJson('/api/v1/missions')->assertJsonCount(0, 'applications');
        $this->actingAs($student)->patchJson($sharing, ['share_email' => false])->assertOk();
        $this->actingAs($company->fresh())->getJson('/api/v1/missions')
            ->assertJsonPath('applications.0.contact_email', null);
        config(['mail.default' => 'smtp']);
        Mail::fake();
        $contact = "/api/v1/missions/{$mission}/applications/{$student->id}/contact";
        $this->actingAs($other)->postJson($contact, ['message' => 'Bonjour.'])->assertNotFound();
        $this->actingAs($company->fresh())->postJson($contact, ['message' => 'Bonjour.'])->assertOk();
        Mail::assertSent(ApplicationContact::class, fn ($mail) => $mail->hasTo($student->email) && $mail->body === 'Bonjour.');
        Mail::assertSentCount(1);
        $this->actingAs($student);
        $this->actingAs($other)->deleteJson("/api/v1/missions/{$mission}")->assertNotFound();
        $this->actingAs($company->fresh())->deleteJson("/api/v1/missions/{$mission}")->assertConflict();
        $this->actingAs($student)->deleteJson("/api/v1/missions/{$mission}")->assertNotFound();
        $this->patchJson("/api/v1/missions/{$mission}/applications/me", ['message' => 'Message mis à jour.'])->assertOk();
        $this->actingAs($other)->patchJson("/api/v1/missions/{$mission}/visibility", ['visible' => false])->assertNotFound();
        $this->actingAs($company->fresh())->patchJson("/api/v1/missions/{$mission}/visibility", ['visible' => false])->assertOk();
        $this->getJson('/api/v1/missions')->assertJsonPath('applications.0.message', 'Message mis à jour.');
        $anotherStudent = User::factory()->create(['role' => 'student']);
        $this->actingAs($anotherStudent)->postJson("/api/v1/missions/{$mission}/applications")->assertNotFound();
        $this->deleteJson("/api/v1/missions/{$mission}/applications/me")->assertNotFound();
        $this->actingAs($student)->getJson('/api/v1/missions')->assertJsonCount(0, 'missions')
            ->assertJsonPath('applications.0.title', 'Mission');
        $this->travel(2)->days();
        $this->actingAs($company->fresh())->patchJson("/api/v1/missions/{$mission}/visibility", ['visible' => true])->assertOk();
        $this->actingAs($student)->getJson('/api/v1/missions')->assertJsonCount(1, 'missions')
            ->assertJsonPath('missions.0.published_at', $publishedAt)
            ->assertJsonPath('missions.0.companyId', $company->id)
            ->assertJsonCount(1, 'companies')
            ->assertJsonPath('companies.0.id', $company->id)
            ->assertJsonMissingPath('companies.0.email');
        $this->deleteJson("/api/v1/missions/{$mission}/applications/me")->assertOk();
        $this->assertDatabaseCount('applications', 0);
        $this->postJson("/api/v1/missions/{$mission}/applications")->assertOk();
        $this->actingAs($anotherStudent)->postJson("/api/v1/missions/{$mission}/applications")->assertOk();
        $accept = "/api/v1/missions/{$mission}/applications/{$student->id}/accept";
        $this->actingAs($other)->postJson($accept)->assertNotFound();
        $this->actingAs($company->fresh())->postJson($accept)->assertOk();
        $this->postJson("/api/v1/missions/{$mission}/applications/{$anotherStudent->id}/accept")->assertConflict();
        $this->actingAs($student)->getJson('/api/v1/missions')
            ->assertJsonPath('missions.0.status', 'occupied')
            ->assertJsonPath('applications.0.status', 'accepted')
            ->assertJsonMissingPath('missions.0.selected_student_id');
        $this->deleteJson("/api/v1/missions/{$mission}/applications/me")->assertConflict();
        $this->actingAs($anotherStudent)->getJson('/api/v1/missions')->assertJsonPath('applications.0.status', 'not_selected');
        $this->postJson("/api/v1/missions/{$mission}/applications")->assertConflict();
        $release = "/api/v1/missions/{$mission}/release";
        $this->actingAs($other)->postJson($release)->assertNotFound();
        $this->actingAs($company->fresh())->postJson($release)->assertOk();
        $this->postJson($release)->assertConflict();
        $this->assertDatabaseHas('missions', ['id' => $mission, 'status' => 'published', 'selected_student_id' => null]);
        $this->actingAs($student)->getJson('/api/v1/missions')
            ->assertJsonPath('missions.0.published_at', $publishedAt)
            ->assertJsonPath('applications.0.status', 'submitted');
        $newStudent = User::factory()->create(['role' => 'student']);
        $this->actingAs($newStudent)->postJson("/api/v1/missions/{$mission}/applications")->assertOk();
        $reject = "/api/v1/missions/{$mission}/applications/{$anotherStudent->id}/reject";
        $this->actingAs($other)->postJson($reject)->assertNotFound();
        $this->actingAs($company->fresh())->postJson($reject)->assertOk();
        $this->postJson($reject)->assertConflict();
        $this->postJson("/api/v1/missions/{$mission}/applications/{$anotherStudent->id}/accept")->assertConflict();
        $this->actingAs($anotherStudent)->getJson('/api/v1/missions')->assertJsonPath('applications.0.status', 'rejected');
        $this->deleteJson("/api/v1/missions/{$mission}/applications/me")->assertConflict();
        $this->actingAs($company->fresh())->postJson($accept)->assertOk();
        $work = '/api/v1/missions/work';
        $deliver = "/api/v1/missions/{$mission}/delivery";
        $download = "$deliver/attachment";
        $complete = "/api/v1/missions/{$mission}/complete";
        $url = 'https://example.test/prototype';
        $this->postJson($complete)->assertConflict();
        $this->actingAs($anotherStudent)->getJson($work)->assertJsonCount(0, 'missions');
        $this->postJson($deliver, ['url' => $url])->assertNotFound();
        $this->actingAs($student)->getJson($work)->assertJsonCount(1, 'missions')->assertJsonPath('missions.0.delivery_url', null);
        $this->postJson($deliver, ['url' => 'javascript:alert(1)'])->assertUnprocessable();
        $this->postJson($deliver)->assertUnprocessable();
        $this->post($deliver, ['attachment' => UploadedFile::fake()->create('script.html', 1, 'text/html')], ['Accept' => 'application/json'])->assertUnprocessable();
        $this->post($deliver, ['attachment' => UploadedFile::fake()->create('large.pdf', 2049, 'application/pdf')], ['Accept' => 'application/json'])->assertUnprocessable();
        $attachment = UploadedFile::fake()->create('rapport.pdf', 4, 'application/pdf');
        $this->post($deliver, ['url' => $url, 'attachment' => $attachment], ['Accept' => 'application/json'])->assertOk();
        $attachmentPath = 'mission-deliveries/'.$attachment->hashName();
        Storage::disk('local')->assertExists($attachmentPath);
        $this->get($download)->assertDownload("livrable-{$mission}.pdf");
        $this->postJson($deliver, ['url' => $url])->assertConflict();
        $this->getJson('/api/v1/missions')->assertJsonMissingPath('missions.0.delivery_url');
        $this->actingAs($anotherStudent)->getJson($download)->assertNotFound();
        $this->actingAs($other)->postJson($complete)->assertNotFound();
        $this->getJson($download)->assertNotFound();
        $this->actingAs($company->fresh())->getJson($work)
            ->assertJsonPath('missions.0.delivery_url', $url)
            ->assertJsonPath('missions.0.has_attachment', true)
            ->assertJsonPath('missions.0.attachment_blocked', false)
            ->assertJsonMissingPath('missions.0.delivery_attachment_path');
        \Illuminate\Support\Facades\DB::table('missions')->where('id', $mission)->update(['delivery_scan_status' => 'pending']);
        $this->get($download)->assertDownload("livrable-{$mission}.pdf");
        $this->postJson($release)->assertConflict();
        $this->postJson($complete)->assertOk();
        $this->actingAs($student)->getJson($work)->assertJsonPath('missions.0.delivery_url', $url);
        $this->assertNotNull($this->getJson($work)->json('missions.0.completed_at'));
        $this->getJson('/api/v1/missions')->assertJsonCount(0, 'missions');
        $this->actingAs($admin)->postJson($decision, ['status' => 'rejected', 'expected_status' => 'pending', 'reason' => 'Dossier périmé'])->assertConflict();
        $this->postJson($decision, ['status' => 'rejected', 'expected_status' => 'verified', 'reason' => 'Dossier à réexaminer'])->assertCreated();
        $this->actingAs($student)->getJson('/api/v1/missions')->assertJsonCount(0, 'missions')->assertJsonCount(0, 'companies');
        $this->getJson($download)->assertNotFound();
        $this->actingAs($admin)->postJson($decision, [...$approval, 'expected_status' => 'rejected'])
            ->assertCreated()->assertJsonPath('data.status', 'verified');
        $this->postJson($decision, ['status' => 'suspended', 'expected_status' => 'verified', 'reason' => 'Réexamen'])->assertCreated();
        $this->actingAs($student)->getJson('/api/v1/missions')->assertJsonCount(0, 'missions');
        $this->actingAs($company->fresh())->getJson('/api/v1/missions')->assertJsonCount(0, 'applications');
        $this->assertDatabaseCount('verification_decisions', 4);

        $draft = $this->actingAs($other)->postJson('/api/v1/missions', [
            'title' => 'Brouillon', 'description' => 'Description', 'duration' => '1 semaine', 'skills' => 'PHP',
        ])->assertCreated()->json('id');
        $this->deleteJson("/api/v1/missions/{$draft}")->assertOk();
        $this->assertDatabaseMissing('missions', ['id' => $draft]);

        $removeCompany = "$companies/{$company->id}";
        $this->deleteJson($removeCompany)->assertForbidden();
        $this->actingAs($admin)->deleteJson("$companies/{$student->id}")->assertNotFound();
        $this->deleteJson($removeCompany)->assertNoContent();
        $this->assertSoftDeleted('users', ['id' => $company->id, 'status' => 'suspended']);
        $this->getJson($details)->assertNotFound();
        $this->assertDatabaseHas('company_verifications', ['id' => $dossier]);
        $this->assertDatabaseHas('missions', ['id' => $mission]);
    }
}
