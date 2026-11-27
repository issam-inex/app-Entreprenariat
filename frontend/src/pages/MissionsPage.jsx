import React, { useState } from 'react'
import { BadgeCheck } from 'lucide-react'
import MissionRequirements from '../missions/MissionRequirements.jsx'
import MissionPublication from '../missions/MissionPublication.jsx'
import MissionCategoryFilter from '../missions/MissionCategoryFilter.jsx'
import StatusFilter from '../missions/StatusFilter.jsx'
import { filterMissionsByCategory, missionCategories } from '../missions/missionCategories.js'
import { Avatar, Badge } from '../components/ui.jsx'
import { FormField, ValidatedForm } from '../components/ValidatedForm.jsx'

export default function MissionsPage({ data, busy, onApply, canApply }) {
  const [openMissionId, setOpenMissionId] = useState(null)
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const missions = filterMissionsByCategory(data.missions, category)
    .filter(mission => !status || mission.status === status)

  return (
    <div className="cards">
      <div className="mission-edit-actions">
        <MissionCategoryFilter value={category} onChange={setCategory} />
        <StatusFilter value={status} onChange={setStatus} options={{ published: 'Disponibles', occupied: 'Occupées' }} />
      </div>
      {!missions.length && <p className="panel empty">{category || status ? 'Aucune mission ne correspond aux filtres.' : 'Aucune mission disponible pour le moment.'}</p>}
      {missions.map(mission => {
        const application = data.applications.find(item => item.missionId === mission.id)
        const occupied = mission.status === 'occupied'
        const expanded = openMissionId === mission.id
        const detailsId = `mission-details-${mission.id}`
        return (
          <article className="panel" key={mission.id}>
            <div className="mission-header">
              <div className="mission-identity">
                <Avatar className="company-logo" name={mission.company}
                  photoUrl={data.companies?.find(company => company.id === mission.companyId)?.photo_url} />
                <div>
                  <h2>{mission.title}</h2>
                  <p className="mission-company">
                    {mission.company}{' '}
                    <span className="company-verification-icon" role="img" aria-label="Entreprise vérifiée" tabIndex={0}>
                      <BadgeCheck size={16} aria-hidden="true" />
                      <span className="company-verification-tooltip" aria-hidden="true">Entreprise vérifiée</span>
                    </span>
                  </p>
                  <MissionPublication publishedAt={mission.published_at} />
                  {missionCategories[mission.category] && <Badge>{missionCategories[mission.category]}</Badge>}
                </div>
              </div>
              <button
                className="outline"
                aria-expanded={expanded}
                aria-controls={detailsId}
                onClick={() => setOpenMissionId(expanded ? null : mission.id)}
              >
                {expanded ? 'Masquer les détails' : 'Voir les détails'}
              </button>
              {occupied && <button className="outline" disabled>Mission occupée</button>}
            </div>
            <div className="mission-body" id={detailsId} hidden={!expanded}>
              <h3>Description</h3>
              <p className="mission-description">{mission.description}</p>
              <dl className="mission-details">
                <div><dt>Durée</dt><dd>{mission.duration}</dd></div>
                <div><dt>Compétences demandées</dt><dd>{mission.skills}</dd></div>
              </dl>
              <MissionRequirements mission={mission} />
              {!application && !occupied && <ValidatedForm className="form-actions" onSubmit={(event, showErrors) => {
                event.preventDefault()
                const values = new FormData(event.currentTarget)
                onApply(mission.id, { message: values.get('message'), share_email: values.has('share_email') }, showErrors)
              }}>
                <FormField label="Message de candidature (facultatif)">
                  <textarea name="message" rows={3} maxLength={2000} />
                </FormField>
                <p className="empty">L’entreprise pourra vous contacter par e-mail au sujet de cette candidature.</p>
                <FormField label="Partager mon adresse e-mail avec cette entreprise."><input type="checkbox" name="share_email" /></FormField>
                <br />
                <button className="primary form-actions" disabled={busy || !canApply}>Postuler</button>
              </ValidatedForm>}
            </div>
            <div aria-live="polite">
              {application && <span className="status mission-status">
                {{ accepted: 'Candidature acceptée', not_selected: 'Candidature non retenue', rejected: 'Candidature refusée' }[application.status] ?? 'Candidature envoyée'}
              </span>}
            </div>
          </article>
        )
      })}
    </div>
  )
}
