import React, { useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

const storageKey = 'stagelik:demo'
const companyProfile = { name: 'ENTREPRISE ALPHA', initials: 'EA' }
const studentProfile = { name: 'ISSAM', initials: 'I' }
const example = {
  title: 'Créer une application de gestion des stocks pour une petite entreprise',
  description: 'L’entreprise suit son stock sur Excel et souhaite centraliser ses opérations. L’application doit permettre d’ajouter des produits, d’enregistrer les entrées et sorties de stock et de signaler les produits dont la quantité passe sous un seuil d’alerte.',
  duration: '2 semaines',
  skills: 'React, Laravel, MySQL et création d’une API REST',
}
const fields = [
  ['title', 'Titre de la mission'],
  ['description', 'Description'],
  ['duration', 'Durée'],
  ['skills', 'Compétences demandées'],
]
const pages = {
  publish: ['Publier une mission', 'Proposez une mission courte à des étudiants.', '＋'],
  missions: ['Missions disponibles', 'Trouvez une mission et mettez vos compétences en pratique.', '▤'],
  applications: ['Candidatures reçues', 'Retrouvez les candidatures pour chacune de vos missions.', '▣'],
}

const pageHashes = {
  publish: '#publier',
  missions: '#missions',
  applications: '#candidatures',
}
const initialPage = Object.keys(pageHashes).find(key => pageHashes[key] === window.location.hash) ?? 'publish'

function readDemo() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) ?? { missions: [], applications: [] }
  } catch {
    return { missions: [], applications: [] }
  }
}

function App() {
  const [data, setData] = useState(readDemo)
  const [page, setPage] = useState(initialPage)
  const [form, setForm] = useState(example)
  const [openMissionId, setOpenMissionId] = useState(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState(false)
  const company = page !== 'missions'
  const profile = company ? companyProfile : studentProfile
  const [title, description, icon] = pages[page]

  function navigate(nextPage) {
    if (nextPage !== page) setOpenMissionId(null)
    setPage(nextPage)
    window.history.replaceState(null, '', pageHashes[nextPage])
    setNotice('')
    setError(false)
    if (nextPage !== page) window.scrollTo(0, 0)
  }

  function save(nextData) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextData))
      setData(nextData)
      setError(false)
      return true
    } catch {
      setError(true)
      setNotice('Le navigateur n’a pas pu enregistrer les données de StageLik.')
      return false
    }
  }

  function publish(event) {
    event.preventDefault()
    const mission = Object.fromEntries(fields.map(([key]) => [key, form[key].trim()]))
    if (Object.values(mission).some(value => !value)) {
      setError(true)
      setNotice('Renseignez tous les champs pour publier la mission.')
      return
    }
    const latest = readDemo()
    if (save({ ...latest, missions: [...latest.missions, { ...mission, id: crypto.randomUUID() }] })) {
      setNotice('Mission publiée. Elle est disponible dans l’espace étudiant.')
    }
  }

  function apply(missionId) {
    const latest = readDemo()
    if (latest.applications.some(application => application.missionId === missionId)) {
      setData(latest)
      return
    }
    save({ ...latest, applications: [...latest.applications, { missionId }] })
  }

  function reset() {
    try {
      localStorage.removeItem(storageKey)
    } catch {
      setError(true)
      setNotice('Le navigateur n’a pas pu réinitialiser les données de StageLik.')
      return
    }
    setData(readDemo())
    setForm(example)
    navigate('publish')
    setNotice('Démo réinitialisée.')
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="top-inner">
          <div className="brand"><span className="brand-icon" aria-hidden="true">S</span>StageLik<span className="brand-period">.</span></div>
          <button className="outline reset" onClick={reset}><span aria-hidden="true">↺</span> Réinitialiser la démo</button>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar" aria-label="Espace de travail">
          <div className="profile">
            <div className="profile-top">
              <span className="avatar" aria-hidden="true">{profile.initials}</span>
              <div><strong>{profile.name}</strong><small>{company ? 'Profil entreprise' : 'Profil étudiant'}</small></div>
            </div>
            <button className="outline switch" onClick={() => {
              setData(readDemo())
              navigate(company ? 'missions' : 'applications')
            }}><span aria-hidden="true">⇄</span> Changer de rôle</button>
          </div>
          <nav aria-label="Navigation principale">
            {(company ? ['publish', 'applications'] : ['missions']).map(item => (
              <button key={item} className="nav-item" aria-current={page === item ? 'page' : undefined} onClick={() => navigate(item)}>
                <span aria-hidden="true">{pages[item][2]}</span>{pages[item][0]}
              </button>
            ))}
          </nav>
        </aside>

        <main>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">{company ? 'Espace entreprise' : 'Espace étudiant'}</p>
              <h1>{title}</h1>
              <p>{description}</p>
            </div>
            <div className="hero-art" aria-hidden="true"><span>{icon}</span></div>
          </section>

          {notice && <p className={error ? 'notice error' : 'notice'} role={error ? 'alert' : 'status'}>{notice}</p>}

          {page === 'publish' && (
            <section className="panel" aria-labelledby="details">
              <h2 id="details">Détails de la mission</h2>
              <form onSubmit={publish}>
                <div className="fields">
                  {fields.map(([key, label]) => {
                    const props = {
                      id: key,
                      value: form[key],
                      required: true,
                      onChange: event => setForm({ ...form, [key]: event.target.value }),
                    }
                    return (
                      <div className={key === 'title' || key === 'description' ? 'field wide' : 'field'} key={key}>
                        <label htmlFor={key}>{label}</label>
                        {key === 'description' ? <textarea {...props} rows={3} /> : <input {...props} type="text" />}
                      </div>
                    )
                  })}
                </div>
                <div className="form-actions"><button className="primary" type="submit">Publier la mission</button></div>
              </form>
            </section>
          )}

          {page === 'missions' && (
            data.missions.length === 0 ? <p className="panel empty">Aucune mission disponible pour le moment.</p> :
              <div className="cards">{data.missions.map(mission => {
                const applied = data.applications.some(application => application.missionId === mission.id)
                const expanded = openMissionId === mission.id
                const detailsId = `mission-details-${mission.id}`
                return (
                  <article className="panel" key={mission.id}>
                    <div className="mission-header">
                      <div className="mission-identity">
                        <span className="company-logo" aria-hidden="true">{companyProfile.initials}</span>
                        <div>
                          <h2>{mission.title}</h2>
                          <p>{companyProfile.name}</p>
                        </div>
                      </div>
                      <button
                        className="outline"
                        aria-expanded={expanded}
                        aria-controls={detailsId}
                        onClick={() => setOpenMissionId(expanded ? null : mission.id)}
                      >
                        {expanded ? 'Masquer les détails' : 'Voir les détails'}
                      </button>
                    </div>
                    <div className="mission-body" id={detailsId} hidden={!expanded}>
                      <h3>Description</h3>
                      <p className="mission-description">{mission.description}</p>
                      <dl className="mission-details">
                        <div><dt>Durée</dt><dd>{mission.duration}</dd></div>
                        <div><dt>Compétences demandées</dt><dd>{mission.skills}</dd></div>
                      </dl>
                      <div className="form-actions">
                        {!applied && <button className="primary" onClick={() => apply(mission.id)}>Postuler</button>}
                      </div>
                    </div>
                    <div aria-live="polite">
                      {applied && <span className="status mission-status"><span aria-hidden="true">✓ </span>Candidature envoyée</span>}
                    </div>
                  </article>
                )
              })}</div>
          )}

          {page === 'applications' && (
            data.missions.length === 0 ? <p className="panel empty">Aucune candidature reçue. Publiez une mission pour commencer.</p> :
              <div className="cards">{data.missions.map(mission => {
                const applications = data.applications.filter(application => application.missionId === mission.id)
                return (
                  <article className="panel" key={mission.id}>
                    <h2>{mission.title}</h2>
                    {applications.length === 0 ? <p className="empty">Aucune candidature reçue pour cette mission.</p> :
                      <ul className="application-list">{applications.map(application => (
                        <li key={application.missionId}>
                          <span className="avatar" aria-hidden="true">{studentProfile.initials}</span>
                          <strong>{studentProfile.name}</strong>
                          <span className="status">Reçue</span>
                          <button className="outline" type="button" disabled>Contacter</button>
                        </li>
                      ))}</ul>}
                  </article>
                )
              })}</div>
          )}
        </main>
      </div>
      <footer><strong>StageLik</strong><span>Preuve de technologie</span></footer>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
