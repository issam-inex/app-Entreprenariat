import React, { useState } from 'react'
import { Badge, Button } from '../components/ui.jsx'
import ProfileAvatar from '../components/ProfileAvatar.jsx'
import { companyProfileHref } from '../navigation.js'
import { FormField, ValidatedForm } from '../components/ValidatedForm.jsx'
import StatusFilter from '../missions/StatusFilter.jsx'

export default function MyApplicationsPage({ applications, companies = [], busy, canEdit, onSave, onWithdraw }) {
  const [editing, setEditing] = useState(null)
  const [status, setStatus] = useState('')
  const filteredApplications = applications.filter(application => !status || (application.status ?? 'submitted') === status)

  if (!applications.length) return <div className="panel">
    <p>Aucune candidature envoyée.</p>
    <Button href="#missions">Voir les missions</Button>
  </div>

  return <div className="cards">
    <StatusFilter value={status} onChange={setStatus} options={{ submitted: 'Envoyées', accepted: 'Acceptées', not_selected: 'Non retenues', rejected: 'Refusées' }} />
    {!filteredApplications.length && <p className="panel empty">Aucune candidature pour ce statut.</p>}
    {filteredApplications.map(application => (
    <article className="panel" key={application.missionId}>
      <div className="mission-identity">
        {application.company && <ProfileAvatar className="company-logo" name={application.company}
          href={companies.some(company => company.id === application.companyId) ? companyProfileHref(application.companyId) : undefined}
          photoUrl={companies.find(company => company.id === application.companyId)?.photo_url} />}
        <div>
          <h2>{application.title}</h2>
          {application.company && <p>{application.company}</p>}
        </div>
      </div>
      <Badge tone={application.status === 'accepted' ? 'success' : 'neutral'}>
        {{ accepted: 'Acceptée', not_selected: 'Non retenue', rejected: 'Refusée' }[application.status] ?? 'Envoyée'}
      </Badge>
      {editing === application.missionId ? (
        <ValidatedForm onSubmit={async (event, showErrors) => {
          event.preventDefault()
          const values = new FormData(event.currentTarget)
          if (await onSave(application.missionId, { message: values.get('message'), share_email: values.has('share_email') }, showErrors)) setEditing(null)
        }}>
          <FormField label="Message de candidature">
            <textarea name="message" rows={4} maxLength={2000} defaultValue={application.message ?? ''} />
          </FormField>
          <FormField label="Partager mon adresse e-mail avec cette entreprise."><input type="checkbox" name="share_email" defaultChecked={Boolean(Number(application.share_email))} /></FormField>
          <div className="form-actions mission-edit-actions">
            <Button type="submit" disabled={busy}>Enregistrer</Button>
            <Button variant="outline" disabled={busy} onClick={() => setEditing(null)}>Annuler</Button>
          </div>
        </ValidatedForm>
      ) : (
        <>
          <p className="mission-description">{application.message || 'Aucun message joint.'}</p>
          <div className="form-actions mission-edit-actions">
            <Button variant="outline" disabled={busy || !canEdit} onClick={() => setEditing(application.missionId)}>Modifier ma candidature</Button>
            <Button variant="outline" disabled={busy || !canEdit || ['accepted', 'rejected'].includes(application.status)} onClick={() => {
              if (window.confirm('Retirer cette candidature ? L’entreprise ne la verra plus.')) onWithdraw(application.missionId)
            }}>Retirer ma candidature</Button>
          </div>
        </>
      )}
    </article>
  ))}</div>
}
