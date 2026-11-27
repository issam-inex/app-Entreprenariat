import React, { useId, useState } from 'react'
import { Pencil } from 'lucide-react'
import { FormField } from './ValidatedForm.jsx'
import { Avatar } from './ui.jsx'

export default function ProfilePhotoPicker({ name, photoUrl, disabled }) {
  const [filename, setFilename] = useState('')
  const helpId = useId()

  return <div className="profile-photo-editor">
    <FormField className="field profile-photo-picker" label={<>
      <Avatar name={name} photoUrl={photoUrl} />
      <span className="profile-photo-pencil" aria-hidden="true"><Pencil size={16} /></span>
      <span className="sr-only">Modifier la photo de profil</span>
    </>}>
      <input className="sr-only" name="photo" type="file" accept="image/jpeg,image/png,image/webp"
        disabled={disabled} aria-describedby={helpId} onChange={event => setFilename(event.target.files[0]?.name ?? '')} />
    </FormField>
    <small id={helpId}>{filename || 'JPG, PNG ou WebP · 2 Mo maximum'}</small>
  </div>
}
