<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CompanyVerificationDecided extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly string $status, public readonly string $reason) {}

    public function via(): array
    {
        return ['mail'];
    }

    public function toMail(): MailMessage
    {
        $label = match ($this->status) {
            'verified' => 'Vérifiée',
            'rejected' => 'Refusée',
            'suspended' => 'Suspendue',
            default => 'En attente de vérification',
        };

        return (new MailMessage)->subject('StageLik · Décision de vérification')
            ->line("État de votre entreprise : {$label}")
            ->line($this->reason)
            ->action('Ouvrir mon dossier', config('app.frontend_url').'/#verification');
    }
}
