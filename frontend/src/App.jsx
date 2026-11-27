import React, { lazy, Suspense, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import WorkspaceLayout from './components/WorkspaceLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import AuthPage from './pages/AuthPage.jsx'
import MissionsPage from './pages/MissionsPage.jsx'
import CompaniesPage from './pages/CompaniesPage.jsx'
import ApplicationsPage from './pages/ApplicationsPage.jsx'
import CompanyMissionsPage from './pages/CompanyMissionsPage.jsx'
import MyApplicationsPage from './pages/MyApplicationsPage.jsx'
import MissionWorkPage from './pages/MissionWorkPage.jsx'
import MissionForm from './missions/MissionForm.jsx'
import { emptyMission, fields } from './missions/missionFields.js'
import { pageFromHash, pageHashes } from './navigation.js'
import { request } from './services/api.js'
import { Button, Notice, Skeleton } from './components/ui.jsx'

const VerificationPage = lazy(() => import('./pages/VerificationPage.jsx'))
const AdminCompaniesPage = lazy(() => import('./pages/AdminCompaniesPage.jsx'))
const PasswordPage = lazy(() => import('./pages/PasswordPage.jsx'))
const StudentProfilePage = lazy(() => import('./pages/StudentProfilePage.jsx'))
const CompanyProfilePage = lazy(() => import('./pages/CompanyProfilePage.jsx'))

export default function App() {
  const [account, setAccount] = useState(undefined)
  const [busy, setBusy] = useState(false)
  const { pathname } = useLocation()
  const page = pageFromHash(pathname)
  const go = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyMission)
  const [editing, setEditing] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState(false)
  const company = account?.role === 'company'
  const admin = account?.role === 'admin'
  const defaultPage = admin ? 'admin' : company ? 'verification' : 'missions'
  const allowedPages = admin ? ['admin'] : company ? ['verification', 'publish', 'companyMissions', 'applications', 'missionWork', 'companyProfile'] : ['missions', 'companies', 'myApplications', 'missionWork', 'studentProfile']
  const allowed = allowedPages.includes(page)
  const profileKey = ['student-profile', account?.id]
  const profileQuery = useQuery({
    queryKey: profileKey,
    queryFn: () => request('student/profile'),
    enabled: account?.role === 'student',
    retry: false,
  })
  const profile = account?.role === 'student' ? profileQuery.data : undefined
  const companyProfileQuery = useQuery({
    queryKey: ['company-profile', account?.id],
    queryFn: () => request('company/profile'),
    enabled: company,
    retry: false,
  })
  const photoUrl = company ? companyProfileQuery.data?.photo_url : profile?.photo_url
  const missionQuery = useQuery({
    queryKey: ['missions', account?.id],
    queryFn: () => request('missions'),
    enabled: Boolean(account && allowed && ['publish', 'companyMissions', 'applications', 'missions', 'companies', 'myApplications'].includes(page)),
    retry: false,
  })
  const { data } = missionQuery
  const canTrack = Boolean(account?.email_verified_at) && (!company || account.status === 'verified')
  const workQuery = useQuery({
    queryKey: ['missionWork', account?.id],
    queryFn: () => request('missions/work'),
    enabled: page === 'missionWork' && allowed && canTrack,
    retry: false,
  })
  const queryError = page === 'missionWork' ? workQuery.error : missionQuery.error

  useEffect(() => {
    setEditing(null)
    setNotice('')
    setError(false)
    if (window.location.hash !== '#fonctionnement') window.scrollTo(0, 0)
  }, [page])

  useEffect(() => {
    request('session').then(result => setAccount(result.account)).catch(report)
  }, [])

  useEffect(() => {
    if (queryError) report(queryError)
  }, [queryError, page])

  useEffect(() => {
    if (account && !['home', 'password'].includes(page) && !allowed) navigate(defaultPage)
  }, [account, page, defaultPage, allowed])

  function navigate(nextPage) {
    go('/' + pageHashes[nextPage].slice(1), { replace: true })
    setNotice('')
    setError(false)
    if (nextPage !== page) window.scrollTo(0, 0)
  }

  function report(failure) {
    setError(true)
    setNotice(failure.message)
  }

  async function submitMission(event, showErrors) {
    event.preventDefault()
    const draft = editing ?? form
    const mission = Object.fromEntries(fields.map(([key]) => [key, (draft[key] ?? '').trim()]))
    mission.category = draft.category || null
    const formElement = event.currentTarget
    const values = new FormData(formElement)
    const attachments = values.getAll('attachments').filter(file => file.name)
    const removals = values.getAll('remove_attachments')
    if ((editing?.attachments?.length ?? 0) - removals.length + attachments.length > 3 ||
        attachments.some(file => file.size > 2 * 1024 * 1024 || !/\.(pdf|png|jpe?g|docx|xlsx|pptx)$/i.test(file.name))) {
      showErrors({ attachments: 'Vérifiez le nombre de fichiers (3 maximum), leur taille (2 Mo chacun) et leur format.' })
      return
    }
    if (fields.some(([key, , , required]) => required && !mission[key])) {
      setError(true)
      setNotice('Renseignez tous les champs de la mission.')
      return
    }
    setBusy(true)
    try {
      let payload = removals.length ? { ...mission, remove_attachments: removals } : mission
      let method = editing ? 'PATCH' : 'POST'
      if (attachments.length) {
        payload = new FormData()
        for (const [key, value] of Object.entries(mission)) payload.set(key, value ?? '')
        attachments.forEach(file => payload.append('attachments[]', file))
        removals.forEach(id => payload.append('remove_attachments[]', id))
        if (editing) payload.set('_method', 'PATCH')
        method = 'POST'
      }
      await request(editing ? `missions/${editing.id}` : 'missions', method, payload)
      formElement.elements.attachments.value = ''
      setEditing(null)
      setError(false)
      setNotice(editing ? 'Modifications enregistrées.' : 'Brouillon enregistré. Retrouvez-le dans « Mes missions ».')
      await queryClient.invalidateQueries({ queryKey: ['missions', account.id] })
    } catch (failure) {
      const errors = failure.fields ?? {}
      const fileError = Object.entries(errors).find(([key]) => key.startsWith('attachments.') || key.startsWith('remove_attachments'))?.[1]
      if (showErrors(fileError ? { ...errors, attachments: fileError } : errors)) setNotice('')
      else report(failure)
    } finally {
      setBusy(false)
    }
  }

  async function changeMission(path, method, payload, confirmation, onInvalid) {
    setBusy(true)
    try {
      await request(path, method, payload)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['missions', account.id] }),
        queryClient.invalidateQueries({ queryKey: ['missionWork', account.id] }),
      ])
      setError(false)
      setNotice(confirmation)
      return true
    } catch (failure) {
      if (onInvalid?.(failure.fields)) {
        setNotice('')
        return false
      }
      report(failure)
      return false
    } finally {
      setBusy(false)
    }
  }

  function applyToMission(id, application, showErrors) {
    return changeMission(`missions/${id}/applications`, 'POST', application, 'Candidature envoyée.', showErrors)
  }

  async function resendEmail() {
    setBusy(true)
    try {
      await request('auth/email/resend', 'POST')
      setError(false)
      setNotice('Lien de confirmation envoyé.')
    } catch (failure) {
      report(failure)
    } finally {
      setBusy(false)
    }
  }

  async function logout() {
    setBusy(true)
    try {
      await request('logout', 'POST')
      setAccount(null)
      queryClient.clear()
      setForm(emptyMission)
      navigate('home')
    } catch (failure) {
      report(failure)
    } finally {
      setBusy(false)
    }
  }

  function editMission(mission) {
    setEditing(mission)
    setNotice('')
    setError(false)
  }

  if (page === 'home') return <HomePage workspace={account ? pageHashes[defaultPage] : undefined}
    profile={account && !admin ? { name: account.name, photoUrl, href: pageHashes[company ? 'companyProfile' : 'studentProfile'] } : undefined} />
  if (page === 'password') return (
    <Suspense fallback={<p className="auth-layout" role="status">Chargement…</p>}>
      <PasswordPage />
    </Suspense>
  )
  if (account === undefined || (account && !allowed)) {
    return <main className="auth-layout"><p role={error ? 'alert' : 'status'}>{notice || 'Chargement de StageLik…'}</p></main>
  }
  if (!account) return <AuthPage key={page} initialMode={page === 'register' ? 'register' : 'login'}
    preferredRole={['publish', 'verification', 'companyMissions', 'applications'].includes(page) ? 'company' : 'student'} onConnect={connected => {
    setAccount(connected)
    navigate(connected.role === 'admin' ? 'admin' : connected.role === 'company' ? 'verification' : 'missions')
  }} />

  return (
    <WorkspaceLayout account={account} photoUrl={photoUrl} page={page} allowedPages={allowedPages} busy={busy} onLogout={logout} onNavigate={navigate}>
      {notice && <Notice tone={error ? 'error' : 'success'}>{notice}</Notice>}
      {profile?.complete === false && page !== 'studentProfile' && <Notice>
        <div className="student-profile-reminder">
          <strong>Votre profil est incomplet.</strong>
          <Button variant="outline" onClick={() => navigate('studentProfile')}>Continuer la configuration</Button>
        </div>
      </Notice>}
      {page === 'studentProfile' && account.role === 'student' && <Suspense fallback={<Skeleton label="Chargement du profil…" />}>
        <StudentProfilePage account={account} query={profileQuery} onSave={value => queryClient.setQueryData(profileKey, value)} />
      </Suspense>}
      {page === 'companyProfile' && company && <Suspense fallback={<Skeleton label="Chargement du profil…" />}>
        <CompanyProfilePage account={account} profile={companyProfileQuery} />
      </Suspense>}

      {company && account.status !== 'verified' && ['publish', 'companyMissions'].includes(page) && (
        <Notice>
          <strong>Publication bloquée tant que votre entreprise n’est pas vérifiée.</strong>
          {' '}Vous pouvez préparer et enregistrer des brouillons.{' '}
          <a href="#verification">Consulter le statut de votre dossier</a>
        </Notice>
      )}

      {!account.email_verified_at && (
        <p className="notice">Confirmez votre adresse e-mail. <button className="outline" disabled={busy} onClick={resendEmail}>Renvoyer le lien</button></p>
      )}
      {(page === 'verification' || page === 'admin') && (
        <Suspense fallback={<p role="status">Chargement du dossier…</p>}>
          {admin ? <AdminCompaniesPage account={account} /> :
            <VerificationPage account={account} onRefreshAccount={async () => setAccount((await request('session')).account)} />}
        </Suspense>
      )}
      {company && (page === 'publish' || editing) && (
        <MissionForm key={editing?.id ?? 'new'} draft={editing ?? form} editing={editing} busy={busy}
          onSubmit={submitMission} onChange={editing ? setEditing : setForm} onCancel={() => editMission(null)} />
      )}

      {!data && !error && ['applications', 'companyMissions', 'missions', 'companies', 'myApplications'].includes(page) && <Skeleton label="Chargement des missions…" />}
      {data && page === 'missions' && <MissionsPage data={data} busy={busy} canApply={Boolean(account.email_verified_at)}
        onApply={applyToMission} />}
      {data && page === 'companies' && <CompaniesPage data={data} busy={busy} canApply={Boolean(account.email_verified_at)}
        onApply={applyToMission} />}
      {data && page === 'myApplications' && (
        <MyApplicationsPage applications={data.applications} companies={data.companies} busy={busy} canEdit={Boolean(account.email_verified_at)}
          onSave={(id, application, showErrors) => changeMission(`missions/${id}/applications/me`, 'PATCH', application, 'Candidature modifiée.', showErrors)}
          onWithdraw={id => changeMission(`missions/${id}/applications/me`, 'DELETE', undefined, 'Candidature retirée.')} />
      )}
      {page === 'missionWork' && (
        !canTrack ? <Notice>Confirmez votre e-mail{company && ' et faites vérifier votre entreprise'} pour accéder au suivi des missions.</Notice> :
          workQuery.data ? <MissionWorkPage company={company} busy={busy} missions={workQuery.data.missions}
            onDeliver={(id, payload, onInvalid) => changeMission(`missions/${id}/delivery`, 'POST', payload, 'Livrable soumis.', onInvalid)}
            onComplete={id => changeMission(`missions/${id}/complete`, 'POST', undefined, 'Livrable validé. Mission terminée.')} /> :
            !error && <Skeleton label="Chargement du suivi des missions…" />
      )}
      {data && page === 'applications' && (
        <ApplicationsPage data={data} busy={busy}
          onAccept={(id, student) => changeMission(`missions/${id}/applications/${student}/accept`, 'POST', undefined, 'Candidature acceptée. La mission est désormais occupée.')}
          onReject={(id, student) => changeMission(`missions/${id}/applications/${student}/reject`, 'POST', undefined, 'Candidature refusée.')}
          onContact={(id, student, message, showErrors) => changeMission(`missions/${id}/applications/${student}/contact`, 'POST', { message }, 'E-mail envoyé.', showErrors)} />
      )}
      {data && page === 'companyMissions' && (
        <CompanyMissionsPage data={data} busy={busy} onEdit={editMission}
          onDelete={async id => {
            const deleted = await changeMission(`missions/${id}`, 'DELETE', undefined, 'Mission supprimée.')
            if (deleted && editing?.id === id) setEditing(null)
          }}
          onPublish={id => changeMission(`missions/${id}/publish`, 'POST', undefined, 'Mission publiée.')}
          onRelease={id => changeMission(`missions/${id}/release`, 'POST', undefined, 'Mission libérée. Les candidatures sont rouvertes.')}
          onVisibility={(id, visible) => changeMission(`missions/${id}/visibility`, 'PATCH', { visible }, visible ? 'Mission à nouveau visible.' : 'Mission masquée.')}
          canPublish={account.status === 'verified' && Boolean(account.email_verified_at)} />
      )}
    </WorkspaceLayout>
  )
}
