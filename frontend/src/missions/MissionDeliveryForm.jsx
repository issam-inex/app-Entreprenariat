import React, { useId, useState } from 'react'
import { Button } from '../components/ui.jsx'

const extensions = ['pdf', 'png', 'jpg', 'jpeg', 'docx', 'xlsx', 'pptx']
const maxFileSize = 2 * 1024 * 1024

function validateDelivery(form) {
  const url = form.elements.url.value.trim()
  const attachment = form.elements.attachment.files[0]
  const errors = {}

  if (!url && !attachment) return { required: 'Ajoutez au moins une pièce jointe ou un lien.' }
  if (attachment) {
    const extension = attachment.name.toLowerCase().split('.').pop()
    if (!attachment.name.includes('.') || !extensions.includes(extension)) {
      errors.attachment = 'Format non accepté. Choisissez un fichier PDF, PNG, JPG, DOCX, XLSX ou PPTX.'
    } else if (attachment.size > maxFileSize) {
      errors.attachment = 'Fichier trop volumineux. La taille maximale est de 2 Mo.'
    }
  }
  if (url) {
    const parsed = URL.canParse(url) ? new URL(url) : null
    if (!/^https?:\/\//i.test(url) || !parsed?.hostname || /\s/.test(url)) {
      errors.url = 'Lien invalide. Saisissez une adresse complète commençant par http:// ou https://.'
    }
  }
  return errors
}

export default function MissionDeliveryForm({ busy, onDeliver, replacing }) {
  const id = useId()
  const [errors, setErrors] = useState({})
  const [attempted, setAttempted] = useState(false)

  function showErrors(form, nextErrors) {
    setErrors(nextErrors)
    const field = nextErrors.required || nextErrors.attachment ? form.elements.attachment : form.elements.url
    field.focus()
  }

  function submit(event) {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const nextErrors = validateDelivery(form)
    setAttempted(true)
    if (Object.keys(nextErrors).length) {
      showErrors(form, nextErrors)
      return
    }

    setErrors({})
    const url = form.elements.url.value.trim()
    const attachment = form.elements.attachment.files[0]
    let payload = { url }
    if (attachment) {
      payload = new FormData()
      payload.set('attachment', attachment)
      if (url) payload.set('url', url)
    }
    onDeliver(payload, fields => {
      const attachment = fields?.attachment?.[0]
      const url = fields?.url?.[0]
      if (!attachment && !url) return false
      setErrors({ attachment, url })
      return true
    })
  }

  return <form className="form-actions" noValidate onSubmit={submit}
    onChange={event => {
      if (attempted) setErrors(validateDelivery(event.currentTarget))
    }}>
    <p>{replacing ? 'Ajoutez un nouveau fichier, un nouveau lien ou les deux pour remplacer le livrable.' : 'Ajoutez un fichier, un lien ou les deux.'}</p>
    {errors.required && <p className="field-error" id={`${id}-required`} role="alert">{errors.required}</p>}
    <div className="field">
      <label htmlFor={`${id}-attachment`}>Pièce jointe</label>
      <input id={`${id}-attachment`} name="attachment" type="file" disabled={busy}
        accept={extensions.map(extension => `.${extension}`).join(',')}
        aria-invalid={Boolean(errors.attachment || errors.required)}
        aria-describedby={[`${id}-formats`, errors.attachment && `${id}-file-error`, errors.required && `${id}-required`].filter(Boolean).join(' ')} />
      <small id={`${id}-formats`}>PDF, PNG, JPG, Word, Excel ou PowerPoint · 2 Mo maximum</small>
      {errors.attachment && <small className="field-error" id={`${id}-file-error`} role="alert">{errors.attachment}</small>}
    </div>
    <div className="field">
      <label htmlFor={`${id}-url`}>Lien du livrable</label>
      <input id={`${id}-url`} name="url" type="url" placeholder="https://…" maxLength={2048} disabled={busy}
        aria-invalid={Boolean(errors.url || errors.required)}
        aria-describedby={[`${id}-url-help`, errors.url && `${id}-url-error`, errors.required && `${id}-required`].filter(Boolean).join(' ')} />
      <small id={`${id}-url-help`}>Vérifiez que l’entreprise peut ouvrir le lien.</small>
      {errors.url && <small className="field-error" id={`${id}-url-error`} role="alert">{errors.url}</small>}
    </div>
    <Button className="form-actions" type="submit" disabled={busy}>{replacing ? 'Remplacer le livrable' : 'Soumettre le livrable'}</Button>
  </form>
}
