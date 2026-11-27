import React, { useState } from 'react'
import { Badge, Button } from '../components/ui.jsx'
import MissionRequirements from '../missions/MissionRequirements.jsx'
import MissionPublication from '../missions/MissionPublication.jsx'
import MissionCategoryFilter from '../missions/MissionCategoryFilter.jsx'
import StatusFilter from '../missions/StatusFilter.jsx'
import { filterMissionsByCategory, missionCategories } from '../missions/missionCategories.js'

export default function CompanyMissionsPage({ data, busy, onEdit, onPublish, onVisibility, onDelete, onRelease, canPublish }) {
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const filteredMissions = filterMissionsByCategory(data.missions, category)
    .filter(mission => !status || (mission.completed_at ? 'completed' : mission.status) === status)

  function renderMissions(missions, emptyMessage) {
    if (!missions.length) return <p className="panel empty">{emptyMessage}</p>
    return <div className="cards">{missions.map(mission => {
      const hasApplications = data.applications.some(application => application.missionId === mission.id)
      const draft = mission.status === 'draft'
      const canChange = draft || (canPublish && !hasApplications)
      const actionHintId = `mission-action-hint-${mission.id}`
      return <article className="panel" key={mission.id}>
        <h3>{mission.title}</h3>
        <Badge tone={mission.status === 'published' ? 'info' : 'neutral'}>
          {mission.completed_at ? 'Terminée' : { draft: 'Brouillon', hidden: 'Masquée', published: 'Visible', occupied: 'Occupée' }[mission.status]}
        </Badge>
        {missionCategories[mission.category] && <Badge>{missionCategories[mission.category]}</Badge>}
        {!draft && <MissionPublication publishedAt={mission.published_at} />}
        <details className="form-actions">
          <summary>Voir les détails de la mission</summary>
          <div className="mission-body">
            <p className="mission-description">{mission.description}</p>
            <dl className="mission-details">
              <div><dt>Durée</dt><dd>{mission.duration}</dd></div>
              <div><dt>Compétences demandées</dt><dd>{mission.skills}</dd></div>
            </dl>
            <MissionRequirements mission={mission} />
          </div>
        </details>
        <div className="form-actions mission-edit-actions">
          <Button variant="outline" disabled={busy || !canChange}
            aria-describedby={canChange ? undefined : actionHintId} onClick={() => onEdit(mission)}>Modifier la mission</Button>
          {draft && canPublish && <Button disabled={busy} onClick={() => onPublish(mission.id)}>Publier la mission</Button>}
          {mission.status === 'occupied' && canPublish && !mission.delivery_submitted_at && (
            <Button variant="outline" disabled={busy} onClick={() => {
              if (window.confirm('Libérer cette mission et rouvrir les candidatures ?')) onRelease(mission.id)
            }}>Libérer la mission</Button>
          )}
          {mission.status === 'occupied' && canPublish && <Button variant="outline" href="#missions-en-cours">Suivre le livrable</Button>}
          {['published', 'hidden'].includes(mission.status) && canPublish && (
            <Button variant="outline" disabled={busy} onClick={() => onVisibility(mission.id, mission.status === 'hidden')}>
              {mission.status === 'hidden' ? 'Réafficher la mission' : 'Masquer la mission'}
            </Button>
          )}
          <Button variant="outline" disabled={busy || !canChange} aria-describedby={canChange ? undefined : actionHintId} onClick={() => {
            if (window.confirm(`Supprimer définitivement la mission « ${mission.title} » ?`)) onDelete(mission.id)
          }}>Supprimer la mission</Button>
        </div>
        {!canChange && <p className="mission-publication" id={actionHintId}>
          {canPublish
            ? 'Cette mission a déjà reçu des candidatures. Ses conditions et son historique sont conservés.'
            : 'La modification et la suppression de cette mission nécessitent une entreprise vérifiée et un e-mail confirmé.'}
        </p>}
      </article>
    })}</div>
  }

  return <div className="cards">
    <div className="mission-edit-actions">
      <MissionCategoryFilter value={category} onChange={setCategory} />
      <StatusFilter value={status} onChange={setStatus}
        options={{ draft: 'Brouillons', published: 'Disponibles', occupied: 'Occupées (candidature acceptée)', completed: 'Terminées', hidden: 'Masquées' }} />
    </div>
    {(!status || status === 'draft') && <section aria-labelledby="draft-missions">
      <div className="mission-header"><h2 id="draft-missions">Brouillons</h2><Button href="#publier">Préparer une mission</Button></div>
      {renderMissions(filteredMissions.filter(mission => mission.status === 'draft'),
        category ? 'Aucun brouillon pour ce type.' : 'Aucun brouillon pour le moment.')}
    </section>}
    {status !== 'draft' && <section aria-labelledby="published-missions">
      <h2 id="published-missions">Missions publiées, masquées et terminées</h2>
      {renderMissions(filteredMissions.filter(mission => mission.status !== 'draft'),
        category || status ? 'Aucune mission ne correspond aux filtres.' : 'Aucune mission publiée, occupée ou masquée.')}
    </section>}
  </div>
}
