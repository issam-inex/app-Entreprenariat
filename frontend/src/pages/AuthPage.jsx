import React, { useState } from 'react'
import PublicNavbar from '../components/PublicNavbar.jsx'
import { FormField, ValidatedForm } from '../components/ValidatedForm.jsx'
import { request } from '../services/api.js'

export default function AuthPage({ preferredRole, initialMode, onConnect }) {
  const [mode, setMode] = useState(initialMode)
  const [role, setRole] = useState(preferredRole)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const registering = mode === 'register'

  async function submit(event, showErrors) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    setError('')
    setBusy(true)
    try {
      const { account } = await request(mode, 'POST', { ...values, role })
      onConnect(account)
    } catch (failure) {
      const fields = registering && failure.status === 409 ? { email: failure.message } : failure.fields
      if (!showErrors(fields)) setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return <div className="shell">
    <PublicNavbar currentPage={mode} />
    <main className="auth-layout">
      <section className="panel">
        <h1>{registering ? 'Créer un compte' : 'Se connecter'}</h1>
        {error && <p role="alert" className="notice error">{error}</p>}
        <ValidatedForm key={mode} className="auth-fields" onSubmit={submit}>
          {registering && <>
            <fieldset className="account-options">
              <legend>Type de compte</legend>
              <label><input type="radio" name="account-role" checked={role === 'student'} onChange={() => setRole('student')} /> Étudiant</label>
              <label><input type="radio" name="account-role" checked={role === 'company'} onChange={() => setRole('company')} /> Entreprise</label>
            </fieldset>
            <FormField label={role === 'company' ? 'Nom de l’entreprise' : 'Nom complet'}>
              <input name="name" autoComplete={role === 'company' ? 'organization' : 'name'} maxLength={100} required />
            </FormField>
            {role === 'company' && <p className="empty">StageLik doit valider votre compte avant que vous puissiez publier une mission.</p>}
          </>}
          <FormField label={registering && role === 'company' ? 'E-mail professionnel' : 'Adresse e-mail'}>
            <input name="email" type="email" autoComplete="username" maxLength={254} required />
          </FormField>
          <FormField label={registering ? 'Mot de passe (10 caractères minimum)' : 'Mot de passe'}>
            <input name="password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 10 : undefined} maxLength={72} data-max-bytes={72} required />
          </FormField>
          <button className="primary" disabled={busy}>{registering ? 'Créer mon compte' : 'Se connecter'}</button>
          <button className="outline" disabled={busy} type="button" onClick={() => {
            setMode(registering ? 'login' : 'register')
            setError('')
          }}>{registering ? 'J’ai déjà un compte' : 'Créer un compte'}</button>
          {!registering && <a href="#reinitialiser">Mot de passe oublié</a>}
        </ValidatedForm>
      </section>
    </main>
  </div>
}
