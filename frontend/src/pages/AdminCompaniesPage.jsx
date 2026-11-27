import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Notice, Skeleton } from '../components/ui.jsx'
import { request } from '../services/api.js'
import VerificationPage from './VerificationPage.jsx'
import { verificationLabels } from './verificationLabels.js'

const tones = { pending: 'warning', verified: 'success', rejected: 'error', suspended: 'error' }

export default function AdminCompaniesPage({ account }) {
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const queryClient = useQueryClient()
  const companies = useQuery({
    queryKey: ['admin-companies', account.id, page, filter],
    queryFn: () => request(`admin/companies?page=${page}${filter ? `&status=${filter}` : ''}`),
    enabled: selected === null,
    retry: false,
  })
  const removal = useMutation({
    mutationFn: company => request(`admin/companies/${company.id}`, 'DELETE'),
    onSuccess: async () => {
      if (page > 1 && companies.data?.data.length === 1) setPage(page - 1)
      await queryClient.invalidateQueries({ queryKey: ['admin-companies', account.id] })
    },
  })

  if (selected) return <div className="cards">
    <div><Button variant="outline" onClick={() => setSelected(null)}>Retour aux entreprises</Button></div>
    <VerificationPage key={selected.id} account={account} company={selected} />
  </div>

  return <div className="cards">
    <label className="field">État des entreprises
      <select value={filter} onChange={event => { setFilter(event.target.value); setPage(1) }}>
        <option value="">Tous les états</option>
        {Object.entries(verificationLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
    </label>
    {companies.isPending && <Skeleton label="Chargement des entreprises…" />}
    {companies.isError && <Notice tone="error">{companies.error.message}</Notice>}
    {removal.isError && <Notice tone="error">{removal.error.message}</Notice>}
    {removal.isSuccess && <Notice tone="success">Entreprise supprimée.</Notice>}
    {companies.data?.data.length === 0 && <p className="panel empty">Aucune entreprise à afficher.</p>}
    {companies.data?.data.length > 0 && <ul className="application-list cards" aria-label="Entreprises inscrites">
      {companies.data.data.map(company => <li className="panel" key={company.id}>
        <strong>{company.name}</strong>
        <Badge tone={tones[company.status]}>{verificationLabels[company.status] ?? company.status}</Badge>
        <Button variant="outline" aria-label={`Voir le détail de ${company.name}`} onClick={() => setSelected(company)}>Voir le détail</Button>
        <Button variant="outline" className="admin-delete-company" disabled={removal.isPending}
          aria-label={`Supprimer ${company.name}`} onClick={() => {
            if (window.confirm(`Supprimer « ${company.name} » ? Son accès sera désactivé et ses missions seront retirées du catalogue.`)) {
              removal.mutate(company)
            }
          }}>Supprimer</Button>
      </li>)}
    </ul>}
    {companies.data?.last_page > 1 && <div className="mission-edit-actions">
      <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Page précédente</Button>
      <span>Page {page} sur {companies.data.last_page}</span>
      <Button variant="outline" disabled={page >= companies.data.last_page} onClick={() => setPage(page + 1)}>Page suivante</Button>
    </div>}
  </div>
}
