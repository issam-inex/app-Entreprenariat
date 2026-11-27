import React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useLocation } from 'react-router-dom'
import { useState } from 'react'
import { z } from 'zod'
import Brand from '../components/Brand.jsx'
import ThemeToggle from '../components/ThemeToggle.jsx'
import { FormField } from '../components/ValidatedForm.jsx'
import { request } from '../services/api.js'

const schema = z.object({
  email: z.string().trim().min(1, 'Saisissez votre adresse e-mail.').pipe(z.email('Saisissez une adresse e-mail valide.')),
  password: z.string(),
  password_confirmation: z.string(),
})

export default function PasswordPage() {
  const { search } = useLocation()
  const link = new URLSearchParams(search)
  const token = link.get('token')
  const [message, setMessage] = useState()
  const { register, handleSubmit, formState, setError } = useForm({
    resolver: zodResolver(schema.superRefine((input, context) => {
      if (!token) return
      if (input.password.length < 10 || new TextEncoder().encode(input.password).length > 72) {
        context.addIssue({ code: 'custom', path: ['password'], message: 'Le mot de passe doit comporter au moins 10 caractères et au plus 72 octets.' })
      }
      if (input.password !== input.password_confirmation) {
        context.addIssue({ code: 'custom', path: ['password_confirmation'], message: 'Les mots de passe doivent correspondre.' })
      }
    })),
    defaultValues: { email: link.get('email') ?? '', password: '', password_confirmation: '' },
  })

  async function submit(values) {
    setMessage(undefined)
    try {
      if (token) await request('auth/password/reset', 'POST', { ...values, token })
      else await request('auth/password/forgot', 'POST', { email: values.email })
      setMessage({ error: false, text: token ? 'Mot de passe mis à jour. Vous pouvez vous reconnecter.' :
        'Si un compte correspond à cette adresse, vous recevrez un lien de réinitialisation.' })
    } catch (failure) {
      const fields = token ? ['email', 'password', 'password_confirmation'] : ['email']
      const invalid = fields.filter(field => failure.fields?.[field]?.[0])
      if (invalid.length) {
        invalid.forEach(field => setError(field, { type: 'server', message: failure.fields[field][0] }))
        return
      }
      setMessage({ error: true, text: failure instanceof Error ? failure.message : 'Une erreur est survenue.' })
    }
  }

  return <div className="shell">
    <header className="topbar"><div className="top-inner"><a className="brand-link" href="#accueil"><Brand /></a><ThemeToggle /></div></header>
    <main className="auth-layout">
      <section className="panel">
        <h1>{token ? 'Nouveau mot de passe' : 'Mot de passe oublié'}</h1>
        {message && <p role={message.error ? 'alert' : 'status'} className={message.error ? 'notice error' : 'notice'}>{message.text}</p>}
        <form className="auth-fields" noValidate onSubmit={handleSubmit(submit)}>
          <FormField label="Adresse e-mail" error={formState.errors.email?.message}><input type="email" autoComplete="username" {...register('email')} /></FormField>
          {token && <>
            <FormField label="Nouveau mot de passe" error={formState.errors.password?.message}><input type="password" autoComplete="new-password" {...register('password')} /></FormField>
            <FormField label="Confirmer le mot de passe" error={formState.errors.password_confirmation?.message}><input type="password" autoComplete="new-password" {...register('password_confirmation')} /></FormField>
          </>}
          <button className="primary" disabled={formState.isSubmitting || Boolean(message && !message.error)}>
            {token ? 'Mettre à jour' : 'Envoyer le lien'}
          </button>
          <a href="#missions">Retour à la connexion</a>
        </form>
      </section>
    </main>
  </div>
}
