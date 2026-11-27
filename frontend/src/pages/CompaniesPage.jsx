import React, { useState } from 'react'
import { Avatar, Badge, Button } from '../components/ui.jsx'
import MissionsPage from './MissionsPage.jsx'

const searchable = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

export default function CompaniesPage({ data, busy, canApply, onApply }) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const companies = data.companies ?? []
  const selected = companies.find(company => company.id === selectedId)
  const counts = new Map()
  for (const mission of data.missions) {
    if (mission.status !== 'occupied') counts.set(mission.companyId, (counts.get(mission.companyId) ?? 0) + 1)
  }
  const filtered = companies.filter(company => [company.name, company.city, company.sector].some(value => value && searchable(value).includes(searchable(search))))

  if (selected) {
    const missions = data.missions.filter(mission => mission.companyId === selected.id)
    return <div className="cards">
      <div><Button variant="outline" onClick={() => setSelectedId(null)}>Retour aux entreprises</Button></div>
      <section className="panel">
        <div className="student-profile-identity">
          <Avatar name={selected.name} photoUrl={selected.photo_url} />
          <div><h2>{selected.name}</h2><Badge tone="success">Entreprise vérifiée</Badge></div>
        </div>
        {(selected.city || selected.sector) && <dl className="mission-details">
          {selected.city && <div><dt>Ville</dt><dd>{selected.city}</dd></div>}
          {selected.sector && <div><dt>Secteur d’activité</dt><dd>{selected.sector}</dd></div>}
        </dl>}
        {selected.description && <div className="form-actions"><h3>À propos</h3><p className="mission-description">{selected.description}</p></div>}
        {selected.website && /^https?:\/\//i.test(selected.website) && <div className="form-actions">
          <Button variant="outline" href={selected.website} target="_blank" rel="noopener noreferrer">Visiter le site web</Button>
        </div>}
      </section>
      <section className="cards" aria-labelledby="company-mission-list">
        <h2 id="company-mission-list">Missions de {selected.name}</h2>
        {missions.length ? <MissionsPage data={{ ...data, missions }} busy={busy} canApply={canApply} onApply={onApply} /> :
          <p className="panel empty">Cette entreprise n’a pas de mission disponible pour le moment.</p>}
      </section>
    </div>
  }

  return <div className="cards">
    <label className="field">Rechercher une entreprise
      <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nom, ville ou secteur" />
    </label>
    {filtered.length ? filtered.map(company => {
      const count = counts.get(company.id) ?? 0
      return <article className="panel mission-header" key={company.id}>
        <div className="mission-identity">
          <Avatar name={company.name} photoUrl={company.photo_url} />
          <div>
            <h2>{company.name}</h2>
            {(company.city || company.sector) && <p>{[company.city, company.sector].filter(Boolean).join(' · ')}</p>}
            <p>{count} {count === 1 ? 'mission disponible' : 'missions disponibles'}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setSelectedId(company.id)}>Voir le profil</Button>
      </article>
    }) : <p className="panel empty">{search.trim() ? 'Aucune entreprise ne correspond à votre recherche.' : 'Aucune entreprise vérifiée pour le moment.'}</p>}
  </div>
}
