import React, { useEffect, useRef, useState } from 'react'
import { Menu, X } from 'lucide-react'
import Brand from './Brand.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { Button } from './ui.jsx'

export default function PublicNavbar({ workspace, currentPage }) {
  const [open, setOpen] = useState(false)
  const toggle = useRef(null)
  const firstLink = useRef(null)
  const close = () => setOpen(false)

  useEffect(() => {
    if (open) firstLink.current?.focus()
  }, [open])

  return (
    <header className="public-navbar" onKeyDown={event => {
      if (event.key === 'Escape' && open) {
        close()
        toggle.current?.focus()
      }
    }}>
      <div className="public-navbar-inner">
        <a className="brand-link" href="#accueil" aria-label="Accueil StageLik" onClick={close}><Brand /></a>
        <nav id="public-navigation" className="public-navigation" aria-label="Navigation principale" data-open={open}>
          <a ref={firstLink} href="#parcours" onClick={close}>Étudiants et entreprises</a>
          <a href="#categories" onClick={close}>Exemples de missions</a>
          <a href="#fonctionnement" onClick={close}>Comment ça marche</a>
          {!workspace && <a className="mobile-register" href="#inscription" onClick={close}>Créer un compte</a>}
        </nav>
        <div className="public-actions">
          <ThemeToggle />
          {workspace ? (
            <Button href={workspace} onClick={close}>Mon espace</Button>
          ) : (
            <>
              <Button variant="ghost" href="#connexion" onClick={close}
                aria-current={currentPage === 'login' ? 'page' : undefined}>Connexion</Button>
              <Button className="desktop-register" href="#inscription" onClick={close}
                aria-current={currentPage === 'register' ? 'page' : undefined}>Créer un compte</Button>
            </>
          )}
          <Button ref={toggle} variant="outline" className="menu-toggle" aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-controls="public-navigation" aria-expanded={open} onClick={() => setOpen(value => !value)}>
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
