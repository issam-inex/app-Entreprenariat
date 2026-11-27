import React, { useEffect, useState } from 'react'
import { request } from '../services/api.js'
import { FormField, ValidatedForm } from '../components/ValidatedForm.jsx'
import { Skeleton } from '../components/ui.jsx'
import { verificationLabels as labels } from './verificationLabels.js'

const fields = [
  ['legal_name', 'Raison sociale', 180],
  ['ice', 'ICE (15 chiffres)', 15],
  ['commerce_register', 'Numéro de registre du commerce', 40],
  ['registration_city', 'Ville d’immatriculation', 100],
  ['representative_name', 'Nom du représentant', 120],
  ['representative_position', 'Fonction du représentant', 120],
]

export default function VerificationPage({ account, company, onRefreshAccount }) {
  const admin = Boolean(company)
  const path = admin ? `admin/companies/${company.id}/verifications` : 'company/verifications'
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const endpoint = `${path}?page=${page}`

  useEffect(() => {
    let current = true
    setResult(null)
    request(endpoint).then(data => { if (current) setResult(data) }).catch(error => {
      if (current) setMessage({ error: true, text: error.message })
    })
    return () => { current = false }
  }, [endpoint])

  async function save(event, showErrors, dossier) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const payload = admin ? {
      status: values.get('status'),
      expected_status: dossier.status,
      reason: values.get('reason'),
      legal_checked: values.has('legal_checked'),
      representative_checked: values.has('representative_checked'),
    } : values
    setBusy(true)
    setMessage(null)
    try {
      await request(admin ? `admin/verifications/${dossier.id}/decisions` : path, 'POST', payload)
      if (!admin) await onRefreshAccount()
      setResult(await request(endpoint))
      setMessage({ text: admin ? 'Décision enregistrée.' : 'Dossier envoyé pour vérification.' })
    } catch (failure) {
      if (!showErrors(failure.fields)) setMessage({ error: true, text: failure.message })
    } finally {
      setBusy(false)
    }
  }

  const latest = result?.data[0]
  const canSubmit = !admin && account.email_verified_at && result && (
    account.status === 'rejected' || (account.status === 'pending' && !latest)
  )
  return <div className="cards">
    {message && <p className={message.error ? 'notice error' : 'notice'} role={message.error ? 'alert' : 'status'}>{message.text}</p>}
    {admin && <section className="panel">
      <h2>{result?.company?.name ?? company.name}</h2>
      <p className="status">{labels[result?.company?.status ?? company.status]}</p>
    </section>}
    {!result && !message?.error && <Skeleton label="Chargement des dossiers…" />}
    {!admin && <p className="notice" role="status">{labels[account.status]}{!account.email_verified_at && ' · Confirmez votre adresse avant de déposer un dossier.'}</p>}
    {canSubmit && <section className="panel">
      <h2>{account.status === 'rejected' ? 'Déposer un dossier corrigé' : 'Déposer un dossier'}</h2>
      <p>Adresse professionnelle confirmée : {account.email}</p>
      <ValidatedForm className="auth-fields" onSubmit={save}>
        {fields.map(([key, label, maxLength]) => <FormField label={label} key={key}>
          <input name={key} maxLength={maxLength} defaultValue={latest?.[key]} required
            data-pattern-message={key === 'ice' ? 'L’ICE doit comporter exactement 15 chiffres.' : undefined}
            inputMode={key === 'ice' ? 'numeric' : undefined} pattern={key === 'ice' ? '[0-9]{15}' : undefined} />
        </FormField>)}
        <FormField label="Justificatif légal (PDF, 10 Mo maximum)">
          <input name="document" type="file" accept="application/pdf" data-pdf-limit={10} required />
        </FormField>
        <button className="primary" disabled={busy}>Soumettre le dossier</button>
      </ValidatedForm>
    </section>}
    {result?.data.length === 0 && !canSubmit && <p className="panel empty">{admin ? 'Cette entreprise n’a pas encore déposé de dossier.' : 'Aucun dossier à afficher.'}</p>}
    {result?.data.map(dossier => {
      const targets = { pending: ['verified', 'rejected'], verified: ['rejected', 'suspended'], rejected: ['verified'], suspended: ['pending'] }[dossier.status]
      return <article className="panel" key={dossier.id}>
        <h2>{dossier.legal_name}</h2>
        <p className="status">{labels[dossier.status]}</p>
        <dl className="mission-details">
          {fields.slice(1).map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{dossier[key]}</dd></div>)}
          <div><dt>Adresse professionnelle</dt><dd>{dossier.professional_email}</dd></div>
        </dl>
        <p><a href={`/api/v1/verification-documents/${dossier.id}/download`}>Télécharger le justificatif</a></p>
        {dossier.decisions?.length > 0 && <section>
          <h3>Historique des décisions</h3>
          <ul>{dossier.decisions.map((decision, index) => <li key={index}>
            {labels[decision.status]} · {new Date(decision.created_at).toLocaleDateString('fr-MA')} · {decision.reason}
          </li>)}</ul>
        </section>}
        {admin && dossier.is_current && targets && <ValidatedForm key={dossier.status} className="auth-fields" onSubmit={(event, showErrors) => save(event, showErrors, dossier)}>
          <FormField label={dossier.status === 'pending' ? 'Décision' : 'Changer la décision'}>
            <select name="status" defaultValue="" required>
              <option value="" disabled>Choisir une décision</option>
              {targets.map(target => <option key={target} value={target}>
                {{ verified: 'Accepter l’entreprise', rejected: 'Refuser l’entreprise', suspended: 'Suspendre l’entreprise', pending: 'Remettre en attente' }[target]}
              </option>)}
            </select>
          </FormField>
          {targets.includes('verified') && <>
            <FormField label="Existence légale contrôlée"><input name="legal_checked" type="checkbox" data-confirmation="Confirmez le contrôle de l’existence légale." /></FormField>
            <FormField label="Lien du représentant contrôlé"><input name="representative_checked" type="checkbox" data-confirmation="Confirmez le contrôle du lien avec le représentant." /></FormField>
          </>}
          <FormField label="Motif de la décision"><textarea name="reason" maxLength={2000} required /></FormField>
          <button className="primary" disabled={busy}>Enregistrer la décision</button>
        </ValidatedForm>}
      </article>
    })}
    {result?.meta.last_page > 1 && <div className="mission-edit-actions">
      <button className="outline" disabled={page === 1 || busy} onClick={() => setPage(page - 1)}>Page précédente</button>
      <span>Page {page} sur {result.meta.last_page}</span>
      <button className="outline" disabled={page >= result.meta.last_page || busy} onClick={() => setPage(page + 1)}>Page suivante</button>
    </div>}
  </div>
}
