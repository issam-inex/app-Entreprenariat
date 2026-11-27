import React from 'react'
import { BadgeCheck, BriefcaseBusiness, ClipboardCheck, FilePlus, Inbox, LogOut, UserRound } from 'lucide-react'
import Brand from './Brand.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import ProfileAvatar from './ProfileAvatar.jsx'
import { Badge, Button, SkipLink } from './ui.jsx'
import { pages } from '../navigation.js'

const icons = { admin: ClipboardCheck, verification: BadgeCheck, publish: FilePlus, applications: Inbox, myApplications: Inbox, missions: BriefcaseBusiness, companyMissions: BriefcaseBusiness, companies: BriefcaseBusiness, missionWork: ClipboardCheck, studentProfile: UserRound, companyProfile: BriefcaseBusiness }

export default function WorkspaceLayout({ account, photoUrl, page, allowedPages, busy, onLogout, onNavigate, children }) {
  const company = account.role === 'company'
  const roleLabel = { student: 'étudiant', company: 'entreprise', admin: 'administration' }[account.role]
  const [title, description] = pages[page]

  return (
    <div className="shell workspace-shell">
      <SkipLink />
      <header className="topbar">
        <div className="top-inner">
          <a className="brand-link" href="#accueil" aria-label="Accueil StageLik"><Brand /></a>
          <div className="top-actions">
            <ThemeToggle />
            <Button variant="outline" disabled={busy} onClick={onLogout}><LogOut size={16} aria-hidden="true" /> Se déconnecter</Button>
          </div>
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar" aria-label="Espace de travail">
          <div className="profile">
            <div className="profile-top">
              <ProfileAvatar name={account.name} photoUrl={photoUrl}
                href={company ? '#profil-entreprise' : account.role === 'student' ? '#mon-profil' : undefined} />
              <div><strong>{account.name}</strong><small>Profil {roleLabel}</small>
                {company && account.status === 'verified' && <Badge tone="success"><BadgeCheck size={13} aria-hidden="true" /> Entreprise vérifiée</Badge>}
              </div>
            </div>
          </div>
          <nav aria-label="Navigation principale">
            {allowedPages.map(item => {
              const Icon = icons[item]
              return (
              <button key={item} className="nav-item" aria-current={page === item ? 'page' : undefined} onClick={() => onNavigate(item)}>
                {Icon && <Icon size={17} aria-hidden="true" />}{pages[item][0]}
              </button>
              )
            })}
          </nav>
        </aside>

        <main id="contenu" tabIndex={-1}>
          <header className="workspace-title">
            <p className="workspace-context">Espace {roleLabel}</p>
            <h1>{title}</h1>
            <p>{description}</p>
          </header>
          {children}
        </main>
      </div>
      <footer><strong>StageLik</strong><span>Missions étudiantes et projets d’entreprise</span></footer>
    </div>
  )
}
