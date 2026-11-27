import React from 'react'
import { Badge, Button, Notice } from '../components/ui.jsx'
import AttachmentDownload from '../missions/AttachmentDownload.jsx'
import MissionDeliveryForm from '../missions/MissionDeliveryForm.jsx'
import MissionRequirements from '../missions/MissionRequirements.jsx'

const calendar = new Intl.DateTimeFormat('fr-MA', { dateStyle: 'long' })
const steps = ['En cours', 'Livrable soumis', 'Terminée']
export default function MissionWorkPage({ missions, company, busy, onDeliver, onComplete }) {
  if (!missions.length) return <div className="panel">
    <p>{company ? 'Aucune mission attribuée pour le moment.' : 'Aucune mission acceptée pour le moment.'}</p>
    <Button href={company ? '#candidatures' : '#missions'}>{company ? 'Voir les candidatures' : 'Voir les missions'}</Button>
  </div>

  return <div className="cards">{missions.map(mission => {
    const step = mission.completed_at ? 2 : mission.delivery_submitted_at ? 1 : 0
    const flagged = mission.link_reported || mission.attachment_blocked
    const canReplace = !company && step === 1 && flagged
    return <article className="panel" key={mission.id}>
      <div className="mission-header">
        <h2>{mission.title}</h2>
        <Badge tone={step === 2 ? 'success' : 'info'}>{steps[step]}</Badge>
      </div>
      <p className="mission-description">{company ? `Étudiant retenu : ${mission.student}` : mission.company} · Durée prévue : {mission.duration}</p>
      {mission.started_at && <p className="mission-publication">Commencée le <time dateTime={mission.started_at}>{calendar.format(new Date(mission.started_at))}</time></p>}
      <ol className="mission-progress" aria-label="Avancement de la mission">
        {steps.map((label, index) => <li key={label} aria-current={index === step ? 'step' : undefined} data-reached={index <= step}>{label}</li>)}
      </ol>
      <details>
        <summary>Consignes et détails de la mission</summary>
        <p className="mission-description form-actions">{mission.description}</p>
        <MissionRequirements mission={mission} />
      </details>
      {step > 0 && <div className="form-actions">
        {mission.link_reported && <Notice tone="error">Le lien du livrable a été signalé et masqué.</Notice>}
        {mission.delivery_url && /^https?:\/\//i.test(mission.delivery_url) &&
          <Button variant="outline" href={mission.delivery_url} target="_blank" rel="noopener noreferrer">Ouvrir le livrable</Button>}
        {mission.has_attachment && !mission.attachment_blocked && <AttachmentDownload path={`missions/${mission.id}/delivery/attachment`} />}
        {mission.attachment_blocked && <Notice tone="error">Cette pièce jointe a été bloquée lors d’une analyse précédente.</Notice>}
        {mission.delivery_submitted_at && <p className="mission-publication">Soumis le <time dateTime={mission.delivery_submitted_at}>{calendar.format(new Date(mission.delivery_submitted_at))}</time></p>}
      </div>}
      {!company && (step === 0 || canReplace) && <MissionDeliveryForm replacing={canReplace} busy={busy} onDeliver={(payload, onInvalid) => onDeliver(mission.id, payload, onInvalid)} />}
      {company && step === 1 && <div className="form-actions">
        <Button disabled={busy || flagged} onClick={() => {
          if (window.confirm('Valider le livrable et terminer cette mission ?')) onComplete(mission.id)
        }}>Valider le livrable</Button>
      </div>}
      {step === 2 && <p className="mission-publication">Terminée le <time dateTime={mission.completed_at}>{calendar.format(new Date(mission.completed_at))}</time></p>}
    </article>
  })}</div>
}
