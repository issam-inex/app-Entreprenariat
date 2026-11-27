import React from 'react'
import AttachmentDownload from './AttachmentDownload.jsx'
import { fields } from './missionFields.js'

export default function MissionRequirements({ mission }) {
  return <>
    {fields.filter(([key, , , required]) => !required && mission[key]).map(([key, label]) => (
    <section className="form-actions" key={key}>
      <h3>{label}</h3>
      <p className="mission-description">{mission[key]}</p>
    </section>
    ))}
    {mission.attachments?.length > 0 && <section className="form-actions">
      <h3>Pièces jointes de la mission</h3>
      <ul className="mission-attachments">
        {mission.attachments.map(attachment => <li key={attachment.id}>
          <AttachmentDownload path={`missions/${mission.id}/attachments/${attachment.id}`} label={`Télécharger ${attachment.name}`} />
        </li>)}
      </ul>
    </section>}
  </>
}
