import React, { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FormField, ValidatedForm } from '../components/ValidatedForm.jsx'
import { Button, Notice, Skeleton } from '../components/ui.jsx'
import ProfilePhotoPicker from '../components/ProfilePhotoPicker.jsx'
import { request } from '../services/api.js'

export default function CompanyProfilePage({ account, profile }) {
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const cache = useQueryClient()
  const key = ['company-profile', account.id]

  async function save(event, showErrors) {
    const form = event.currentTarget
    const payload = new FormData(form)
    if (!payload.get('photo').name) payload.delete('photo')
    payload.set('_method', 'PUT')
    setSaving(true)
    setNotice(null)
    try {
      cache.setQueryData(key, await request('company/profile', 'POST', payload))
      form.elements.photo.value = ''
      if (form.elements.remove_photo) form.elements.remove_photo.checked = false
      await cache.invalidateQueries({ queryKey: ['missions'] })
      setNotice({ text: 'Profil entreprise enregistré.' })
    } catch (failure) {
      if (!showErrors(failure.fields)) setNotice({ error: true, text: failure.message })
    } finally {
      setSaving(false)
    }
  }

  if (profile.isPending) return <Skeleton label="Chargement du profil…" />
  if (profile.isError) return <Notice tone="error">{profile.error.message}</Notice>

  return <section className="panel">
    <p className="mission-description">Ces informations apparaissent dans l’annuaire étudiant lorsque votre entreprise est vérifiée.</p>
    {notice && <Notice tone={notice.error ? 'error' : 'success'}>{notice.text}</Notice>}
    <ValidatedForm className="auth-fields form-actions" onSubmit={save}>
      <div className="student-profile-identity">
        <ProfilePhotoPicker key={profile.data.photo_url ?? 'empty'} name={account.name} photoUrl={profile.data.photo_url} disabled={saving} />
        <h2>{account.name}</h2>
      </div>
      {profile.data.photo_url && <FormField label="Retirer la photo actuelle"><input type="checkbox" name="remove_photo" value="1" /></FormField>}
      <div className="fields">
        <FormField label="Ville"><input name="city" maxLength={100} defaultValue={profile.data.city ?? ''} /></FormField>
        <FormField label="Secteur d’activité"><input name="sector" maxLength={100} defaultValue={profile.data.sector ?? ''} /></FormField>
      </div>
      <FormField label="Présentation"><textarea name="description" rows={5} maxLength={2000} defaultValue={profile.data.description ?? ''} /></FormField>
      <FormField label="Site web"><input name="website" type="url" maxLength={2048} placeholder="https://…" defaultValue={profile.data.website ?? ''} /></FormField>
      <div className="mission-edit-actions">
        <Button type="submit" disabled={saving}>Enregistrer le profil</Button>
        <Button variant="outline" href="#mes-missions">Voir mes missions</Button>
      </div>
    </ValidatedForm>
  </section>
}
