import React, { useState } from 'react'
import { Avatar, Badge, Button } from '../components/ui.jsx'
import { FormField, ValidatedForm } from '../components/ValidatedForm.jsx'
import ApplicantProfile from './ApplicantProfile.jsx'

export default function ApplicationsPage({ data, busy, onContact, onAccept, onReject }) {
  const [contact, setContact] = useState(null)
  const [profile, setProfile] = useState(null)
  const missions = data.missions.filter(mission => data.applications.some(application => application.missionId === mission.id))

  if (profile) return <ApplicantProfile path={profile} onBack={() => setProfile(null)} />
  if (!missions.length) return <p className="panel empty">Aucune candidature reçue pour le moment.</p>

  return <div className="cards">{missions.map(mission => (
    <article className="panel" key={mission.id}>
      <h2>{mission.title}</h2>
      <ul className="application-list">{data.applications.filter(application => application.missionId === mission.id).map(application => {
        const key = `${mission.id}-${application.studentId}`
        const profilePath = `missions/${mission.id}/applications/${application.studentId}/profile`
        return <li key={key}>
          <Button variant="ghost" className="applicant-avatar-button" aria-label={`Voir le profil de ${application.name}`}
            onClick={() => setProfile(profilePath)}>
            <Avatar name={application.name} photoUrl={Number(application.has_photo) ? `/api/v1/${profilePath}/photo` : undefined} />
          </Button>
          <strong>{application.name}</strong>
          <Badge tone={application.status === 'accepted' ? 'success' : application.status === 'rejected' ? 'error' : 'info'}>
            {{ accepted: 'Acceptée', not_selected: 'Non retenue', rejected: 'Refusée' }[application.status] ?? 'Reçue'}
          </Badge>
          {mission.status === 'published' && (application.status ?? 'submitted') === 'submitted' && <>
          <Button disabled={busy} onClick={() => {
            if (window.confirm(`Accepter la candidature de ${application.name} ? La mission sera indiquée comme occupée.`)) {
              onAccept(mission.id, application.studentId)
            }
          }}>Accepter la candidature</Button>
          <Button variant="danger" disabled={busy} onClick={() => {
            if (window.confirm(`Refuser la candidature de ${application.name} ?`)) onReject(mission.id, application.studentId)
          }}>Refuser la candidature</Button>
          </>}
          <Button variant="outline" disabled title="Messagerie StageLik à venir">Contacter</Button>
          <Button variant="outline" disabled={busy} aria-expanded={contact === key}
            onClick={() => setContact(contact === key ? null : key)}>Contacter par e-mail</Button>
          {application.message && <p className="application-message mission-description">{application.message}</p>}
          {contact === key && <ValidatedForm className="application-message" onSubmit={async (event, showErrors) => {
            event.preventDefault()
            const message = new FormData(event.currentTarget).get('message')
            if (await onContact(mission.id, application.studentId, message, showErrors)) setContact(null)
          }}>
            <FormField label={`Message pour ${application.name}`}>
              <textarea name="message" rows={4} required maxLength={2000} />
            </FormField>
            <div className="form-actions mission-edit-actions">
              <Button type="submit" disabled={busy}>Envoyer par e-mail</Button>
              <Button variant="outline" disabled={busy} onClick={() => setContact(null)}>Annuler</Button>
              {application.contact_email && (
                <Button variant="outline" href={`mailto:${encodeURIComponent(application.contact_email).replace('%40', '@')}?subject=${encodeURIComponent(`StageLik · ${mission.title}`)}`}>
                  Ouvrir dans ma messagerie
                </Button>
              )}
            </div>
          </ValidatedForm>}
        </li>
      })}</ul>
    </article>
  ))}</div>
}
