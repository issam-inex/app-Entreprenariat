import React, { useRef, useState } from 'react'
import { Sparkles, Upload } from 'lucide-react'
import { Button, Notice } from '../components/ui.jsx'
import { FormField, ValidatedForm } from '../components/ValidatedForm.jsx'
import { fields } from './missionFields.js'
import { parseBrief } from './parseBrief.js'
import { readBrief } from './readBrief.js'
import { missionCategories } from './missionCategories.js'

const attachmentFormats = '.pdf,.png,.jpg,.jpeg,.docx,.xlsx,.pptx'

export default function MissionForm({ draft, editing, busy, onChange, onSubmit, onCancel }) {
  const fileInput = useRef(null)
  const analyzeProse = useRef(false)
  const [importing, setImporting] = useState(false)
  const [feedback, setFeedback] = useState(null)

  function chooseFile(analyze) {
    analyzeProse.current = analyze
    fileInput.current?.click()
  }

  async function importBrief(event) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return
    setImporting(true)
    setFeedback(null)
    try {
      const text = (await readBrief(file)).trim()
      if (!text) throw new Error('Le document ne contient pas de texte exploitable.')
      const { values, truncated } = parseBrief(text, { analyzeProse: analyzeProse.current })
      const imported = fields.filter(([key]) => values[key])
      if (!imported.length) throw new Error('Aucun champ exploitable. Essayez un document structuré avec des titres de section.')
      if (imported.some(([key]) => draft[key]?.trim() && draft[key] !== values[key]) &&
        !window.confirm('Remplacer les champs déjà remplis par les valeurs trouvées dans le document ?')) return
      onChange({ ...draft, ...values })
      const missing = fields.filter(([key, , , required]) => required && !values[key] && !draft[key]?.trim()).map(([, label]) => label)
      const review = missing.length ? ` À compléter : ${missing.join(', ')}.` : ''
      const shortened = fields.filter(([key]) => truncated.includes(key)).map(([, label]) => label)
      const limits = shortened.length ? ` Texte raccourci : ${shortened.join(', ')}.` : ''
      setFeedback({ tone: 'info', text: `Brouillon prérempli. Relisez les champs avant d’enregistrer.${review}${limits}` })
    } catch (error) {
      setFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'Impossible de lire le document.' })
    } finally {
      setImporting(false)
    }
  }

  return (
    <section className="panel" aria-labelledby="details">
      <h2 id="details">{editing ? 'Modifier la mission' : 'Détails de la mission'}</h2>
      {!editing && <div className="mission-import">
        <input ref={fileInput} type="file" accept=".pdf,.docx,.txt,.md" hidden onChange={importBrief} />
        <Button variant="outline" className={feedback?.tone === 'error' ? 'invalid-import' : ''} aria-describedby={feedback ? 'brief-feedback' : undefined} disabled={busy || importing} onClick={() => chooseFile(false)}>
          <Upload size={17} aria-hidden="true" />
          {importing ? 'Lecture du document…' : 'Importer un cahier des charges'}
        </Button>
        <Button variant="outline" className={`brief-ai-button ${feedback?.tone === 'error' ? 'invalid-import' : ''}`} aria-describedby={feedback ? 'brief-feedback' : undefined} disabled={busy || importing} onClick={() => chooseFile(true)}>
          <Sparkles size={17} aria-hidden="true" /> Analyser avec l’IA
        </Button>
        <p>PDF avec texte, DOCX, TXT ou Markdown, 10 Mo maximum. L’analyse repère les mots-clés et les informations dans votre navigateur. Relisez les champs proposés.</p>
      </div>}
      {feedback && <div id="brief-feedback"><Notice tone={feedback.tone}>{feedback.text}</Notice></div>}
      <ValidatedForm key={editing?.id ?? 'publish'} onSubmit={onSubmit}>
        <div className="fields">
          <FormField className="field wide" label="Type de mission">
            <select name="category" value={draft.category ?? ''} onChange={event => onChange({ ...draft, category: event.target.value })}>
              <option value="">Sans type</option>
              {Object.entries(missionCategories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </FormField>
          {fields.map(([key, label, maxLength, required = false]) => {
            const multiline = !['title', 'duration', 'skills'].includes(key)
            const props = {
              id: key,
              name: key,
              value: draft[key] ?? '',
              required,
              disabled: importing,
              maxLength,
              autoFocus: Boolean(editing && key === 'title'),
              onChange: event => onChange({ ...draft, [key]: event.target.value }),
            }
            return (
              <FormField className={key === 'title' || multiline ? 'field wide' : 'field'} key={key} label={required ? label : `${label} (facultatif)`}>
                {multiline ? <textarea {...props} rows={3} /> : <input {...props} type="text" />}
              </FormField>
            )
          })}
          <div className="field wide">
            <FormField label="Ajouter des pièces jointes (facultatif)">
              <input name="attachments" type="file" multiple accept={attachmentFormats} aria-describedby="mission-attachment-formats" />
            </FormField>
            <small id="mission-attachment-formats">Jusqu’à 3 fichiers de 2 Mo chacun. PDF, PNG, JPG, Word, Excel ou PowerPoint.</small>
            {editing?.attachments?.length > 0 && <fieldset>
              <legend>Pièces jointes actuelles</legend>
              {editing.attachments.map(attachment => <label className="mission-attachment-choice" key={attachment.id}>
                <input type="checkbox" name="remove_attachments" value={attachment.id} /> Retirer {attachment.name}
              </label>)}
            </fieldset>}
          </div>
        </div>
        <div className="form-actions mission-edit-actions">
          <button className="primary" type="submit" disabled={busy || importing}>{editing ? 'Enregistrer les modifications' : 'Enregistrer le brouillon'}</button>
          {editing && <button className="outline" type="button" disabled={busy} onClick={onCancel}>Annuler</button>}
        </div>
      </ValidatedForm>
    </section>
  )
}
