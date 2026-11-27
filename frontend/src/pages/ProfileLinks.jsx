import React, { useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { FormField } from '../components/ValidatedForm.jsx'
import { Button } from '../components/ui.jsx'

export default function ProfileLinks({ links, saving }) {
  const [rows, setRows] = useState(() => links.map((link, id) => ({ ...link, id })))
  const nextId = useRef(links.length)

  return <section className="auth-fields">
    <div className="profile-links-heading">
      <h3>Ajouter des liens</h3>
      <Button variant="outline" aria-label="Ajouter un lien" title="Ajouter un lien"
        disabled={saving || rows.length >= 10} onClick={() => {
          const id = nextId.current++
          setRows(current => [...current, { id, name: '', url: '' }])
        }}><Plus size={18} aria-hidden="true" /></Button>
    </div>
    {rows.map((row, index) => <fieldset className="account-options profile-link-row" key={row.id}>
      <legend>Lien {index + 1}</legend>
      <div className="fields">
        <FormField label="Nom de la plateforme">
          <input name={`links.${index}.name`} defaultValue={row.name} maxLength={80} required />
        </FormField>
        <FormField label="Adresse du lien">
          <input name={`links.${index}.url`} type="url" defaultValue={row.url} placeholder="https://…" maxLength={2048} required />
        </FormField>
      </div>
      <Button variant="outline" aria-label={`Retirer le lien ${index + 1}`} disabled={saving}
        onClick={() => setRows(current => current.filter(item => item.id !== row.id))}>Retirer</Button>
    </fieldset>)}
  </section>
}
