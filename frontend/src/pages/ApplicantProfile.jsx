import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Button, Notice, Skeleton } from '../components/ui.jsx'
import { request } from '../services/api.js'

const dateFormat = new Intl.DateTimeFormat('fr-MA', { dateStyle: 'long', timeZone: 'UTC' })

export default function ApplicantProfile({ path, backHref, onBack }) {
  const query = useQuery({ queryKey: ['applicant-profile', path], queryFn: () => request(path), retry: false, gcTime: 0 })
  const profile = query.data

  return <div className="cards">
    <div><Button variant="outline" autoFocus href={backHref} onClick={backHref ? undefined : onBack}>
      {backHref ? 'Retour aux missions en cours' : 'Retour aux candidatures'}
    </Button></div>
    {query.isPending && <Skeleton label="Chargement du profil…" />}
    {query.isError && <Notice tone="error">{query.error.message}</Notice>}
    {profile && !query.isError && <article className="panel">
      <div className="student-profile-identity">
        <Avatar name={profile.name} photoUrl={profile.photo_url} />
        <div>
          <h2>{profile.name}</h2>
          {profile.joined_on && <p className="mission-publication">Membre de StageLik depuis le{' '}
            <time dateTime={profile.joined_on}>{dateFormat.format(new Date(profile.joined_on))}</time>
          </p>}
        </div>
      </div>
      {profile.bio && <section className="form-actions"><h3>Bio</h3><p className="mission-description">{profile.bio}</p></section>}
      {profile.skills && <section className="form-actions"><h3>Compétences</h3><p className="mission-description">{profile.skills}</p></section>}
      {profile.links.length > 0 && <section className="form-actions">
        <h3>Liens professionnels</h3>
        <ul>{profile.links.filter(link => /^https?:\/\//i.test(link.url)).map((link, index) => <li key={index}>
          <a href={link.url} target="_blank" rel="noopener noreferrer">{link.name}</a>
        </li>)}</ul>
      </section>}
      {!profile.bio && !profile.skills && !profile.links.length && <p className="empty">Cet étudiant n’a pas encore complété son profil.</p>}
    </article>}
  </div>
}
