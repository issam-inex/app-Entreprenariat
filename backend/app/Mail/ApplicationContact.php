<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class ApplicationContact extends Mailable
{
    public function __construct(public string $company, public string $companyEmail, public string $mission, public string $body) {}

    public function envelope(): Envelope
    {
        return new Envelope(replyTo: [new Address($this->companyEmail, $this->company)], subject: 'StageLik · Votre candidature');
    }

    public function content(): Content
    {
        return new Content(text: 'mail.application-contact');
    }
}
