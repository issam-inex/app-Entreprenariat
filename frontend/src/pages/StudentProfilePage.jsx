import React, { useState } from 'react'
import { FormField, ValidatedForm } from '../components/ValidatedForm.jsx'
import { Notice, Skeleton } from '../components/ui.jsx'
import ProfilePhotoPicker from '../components/ProfilePhotoPicker.jsx'
import { request } from '../services/api.js'
import ProfileLinks from './ProfileLinks.jsx'

export default function StudentProfilePage({ account, query, onSave }) {
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const profile = query.data

  async function save(event, showErrors) {
    const form = event.currentTarget
    const payload = new FormData(form)
    const links = []
    for (const [key, value] of [...payload]) {
      if (!key.startsWith('links.')) continue
      const [, index, field] = key.split('.')
      links[index] ??= {}
      links[index][field] = value.trim()
      payload.delete(key)
    }
    payload.set('links', JSON.stringify(links))
    if (!payload.get('photo').name) payload.delete('photo')
    payload.set('_method', 'PATCH')
    setNotice(null)
    setSaving(true)
    try {
      onSave(await request('student/profile', 'POST', payload))
      form.elements.photo.value = ''
      if (form.elements.remove_photo) form.elements.remove_photo.checked = false
      setNotice({ text: 'Profil enregistré.' })
    } catch (failure) {
      if (!showErrors(failure.fields)) setNotice({ error: true, text: failure.message })
    } finally {
      setSaving(false)
    }
  }

  if (query.isPending) return <Skeleton label="Chargement du profil…" />
  if (query.isError) return <Notice tone="error">{query.error.message}</Notice>

  return <section className="panel">
    {!profile.complete && <Notice>Ajoutez une bio et vos compétences pour terminer la configuration. La photo et les liens sont facultatifs.</Notice>}
    <p className="empty">Les entreprises vérifiées peuvent consulter ce profil lorsque vous postulez à l’une de leurs missions.</p>
    {notice && <Notice tone={notice.error ? 'error' : 'success'}>{notice.text}</Notice>}
    <ValidatedForm className="auth-fields" onSubmit={save}>
      <div className="student-profile-identity">
        <ProfilePhotoPicker key={profile.photo_url ?? 'empty'} name={account.name} photoUrl={profile.photo_url} disabled={saving} />
        <h2>{account.name}</h2>
      </div>
      {profile.photo_url && <FormField label="Retirer la photo actuelle"><input type="checkbox" name="remove_photo" value="1" /></FormField>}
      <FormField label="Bio">
        <textarea name="bio" rows={4} maxLength={1200} defaultValue={profile.bio ?? ''} placeholder="Présentez-vous en quelques phrases." />
      </FormField>
      <FormField label="Compétences">
        <input name="skills" maxLength={500} defaultValue={profile.skills ?? ''} placeholder="Ex. design graphique, Excel, rédaction" />
      </FormField>
      <ProfileLinks links={profile.links ?? []} saving={saving} />
      <div><button className="primary" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer mon profil'}</button></div>
    </ValidatedForm>
  </section>
}
