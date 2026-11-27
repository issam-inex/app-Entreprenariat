import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormField, ValidatedForm } from '../components/ValidatedForm.jsx'
import { Avatar, Button, Notice, Skeleton } from '../components/ui.jsx'
import { request } from '../services/api.js'

export default function CompanyProfilePage({ account }) {
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const cache = useQueryClient()
  const key = ['company-profile', account.id]
  const profile = useQuery({ queryKey: key, queryFn: () => request('company/profile'), retry: false })

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
    <div className="student-profile-identity"><Avatar name={account.name} photoUrl={profile.data.photo_url} /><h2>{account.name}</h2></div>
    <p className="mission-description">Ces informations apparaissent dans l’annuaire étudiant lorsque votre entreprise est vérifiée.</p>
    {notice && <Notice tone={notice.error ? 'error' : 'success'}>{notice.text}</Notice>}
    <ValidatedForm className="auth-fields form-actions" onSubmit={save}>
      <FormField label="Photo ou logo de l’entreprise">
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="company-photo-formats" />
      </FormField>
      <small id="company-photo-formats">JPG, PNG ou WebP · 2 Mo maximum</small>
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
