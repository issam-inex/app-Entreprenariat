import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  ArrowDown, ArrowRight, BadgeCheck, BriefcaseBusiness, Building2, CalendarDays, ChartNoAxesCombined,
  Check, ChevronDown, Code2, FileText, GraduationCap, LayoutGrid, PanelsTopLeft, PenTool,
  Search, SearchCheck, Send, Target, Users,
} from 'lucide-react'
import Brand from '../components/Brand.jsx'
import PublicNavbar from '../components/PublicNavbar.jsx'
import { Badge, Button, SkipLink } from '../components/ui.jsx'

const categories = [
  { icon: Code2, title: 'Développement', description: 'Prototyper une interface ou créer un outil web.' },
  { icon: PenTool, title: 'Design', description: 'Maquetter un parcours ou améliorer un écran.' },
  { icon: ChartNoAxesCombined, title: 'Data', description: 'Nettoyer des données ou préparer un tableau de bord.' },
  { icon: FileText, title: 'Contenu', description: 'Structurer une documentation ou rédiger un guide.' },
]

const steps = [
  { icon: Target, title: 'Définir la mission', description: 'L’entreprise précise le besoin, les compétences et la durée.' },
  { icon: SearchCheck, title: 'Choisir et postuler', description: 'L’étudiant consulte les détails et envoie sa candidature.' },
  { icon: Users, title: 'Examiner les candidatures', description: 'L’entreprise retrouve les candidatures reçues dans son espace.' },
]

const questions = [
  ['Qui peut postuler à une mission ?', 'Les étudiants peuvent postuler aux missions disponibles après avoir créé leur compte et confirmé leur adresse e-mail.'],
  ['Comment publier une mission ?', 'Créez un compte entreprise, confirmez votre e-mail et transmettez vos justificatifs. Vous pouvez préparer un brouillon pendant la vérification. La publication devient disponible après validation.'],
  ['De quoi ai-je besoin pour faire vérifier mon entreprise ?', 'Préparez votre ICE, votre numéro de registre du commerce, votre ville d’immatriculation, les informations du représentant et un justificatif légal au format PDF.'],
  ['Où retrouver les candidatures reçues ?', 'Ouvrez « Candidatures reçues » dans votre espace entreprise. Vous y retrouvez les candidatures associées à vos propres missions une fois votre entreprise vérifiée.'],
]

function ProductPreview() {
  return (
    <figure className="product-visual">
      <div className="product-window" aria-hidden="true">
        <div className="product-bar"><Brand /><span className="product-bar-label">Espace étudiant</span></div>
        <div className="product-layout">
          <div className="product-rail">
            <span className="product-rail-active"><LayoutGrid size={16} /></span>
            <span><BriefcaseBusiness size={16} /></span><span><FileText size={16} /></span>
          </div>
          <div className="product-content">
            <strong>Missions disponibles</strong>
            <div className="product-search"><Search size={13} /> Rechercher une mission</div>
            <article className="product-mission">
              <div className="product-company"><span className="product-logo"><Building2 size={15} /></span><span>Entreprise exemple</span></div>
              <h2>Créer un outil de suivi des stocks</h2>
              <p>Centraliser les entrées et sorties de stock dans une application web.</p>
              <div className="product-tags"><Badge>React</Badge><Badge>Laravel</Badge><Badge>MySQL</Badge></div>
              <div className="product-mission-footer"><span><CalendarDays size={14} /> 2 semaines</span><span className="product-detail-label">Voir les détails</span></div>
            </article>
          </div>
        </div>
      </div>
      <figcaption><PanelsTopLeft size={14} aria-hidden="true" /> Aperçu illustratif d’une mission</figcaption>
    </figure>
  )
}

export default function HomePage({ workspace }) {
  const { pathname } = useLocation()
  useEffect(() => {
    const section = pathname.slice(1)
    if (['parcours', 'categories', 'fonctionnement', 'faq'].includes(section)) {
      document.getElementById(section)?.scrollIntoView({ block: 'start' })
    }
  }, [pathname])

  return (
    <div className="shell landing">
      <SkipLink />
      <PublicNavbar workspace={workspace} />
      <main id="contenu" tabIndex={-1}>
        <section className="landing-hero landing-container" aria-labelledby="landing-title">
          <div className="landing-copy">
            <p className="landing-kicker">Des missions courtes en entreprise</p>
            <h1 id="landing-title">Des projets réels.<br /><span>De l’expérience concrète.</span></h1>
            <p className="landing-lede">StageLik relie des étudiants qui veulent mettre leurs compétences en pratique à des entreprises qui ont un projet précis à faire avancer.</p>
            <div className="landing-actions">
              <Button href="#missions">Explorer les missions <ArrowRight size={17} aria-hidden="true" /></Button>
              <Button href="#publier" variant="outline">Proposer une mission</Button>
            </div>
            <a className="landing-inline-link" href="#fonctionnement"><ArrowDown size={16} aria-hidden="true" /> Découvrir le fonctionnement</a>
          </div>
          <ProductPreview />
        </section>

        <section className="landing-section landing-section--white" id="parcours" aria-labelledby="parcours-title">
          <div className="landing-container">
            <header className="section-heading">
              <h2 id="parcours-title">Un besoin à résoudre.<br />Une expérience à construire.</h2>
              <p>Quand un projet est trop ciblé pour un stage long, une mission courte donne aux deux parties un cadre clair pour avancer.</p>
            </header>
            <div className="audience-grid">
              <article className="audience-panel">
                <span className="landing-icon"><GraduationCap size={23} aria-hidden="true" /></span>
                <h3>Pour les étudiants</h3>
                <p>Choisissez un projet à votre portée et développez une expérience que vous pourrez présenter.</p>
                <ul><li><Check size={15} aria-hidden="true" /> Consultez la durée et les compétences attendues.</li><li><Check size={15} aria-hidden="true" /> Postulez aux missions qui vous correspondent.</li></ul>
                <a className="landing-inline-link" href="#missions">Trouver une mission <ArrowRight size={16} aria-hidden="true" /></a>
              </article>
              <article className="audience-panel">
                <span className="landing-icon"><Building2 size={22} aria-hidden="true" /></span>
                <h3>Pour les entreprises</h3>
                <p>Transformez un besoin ponctuel en mission ciblée et retrouvez les candidatures au même endroit.</p>
                <ul><li><Check size={15} aria-hidden="true" /> Préparez votre brouillon à votre rythme.</li><li><BadgeCheck size={16} aria-hidden="true" /> Publiez après vérification de votre entreprise.</li></ul>
                <a className="landing-inline-link" href="#publier">Accéder à l’espace entreprise <ArrowRight size={16} aria-hidden="true" /></a>
              </article>
            </div>
          </div>
        </section>

        <section className="landing-section landing-container" id="fonctionnement" aria-labelledby="steps-title">
          <header className="section-heading"><h2 id="steps-title">Comment ça marche ?</h2><p>De la description du besoin à la réception des candidatures.</p></header>
          <ol className="workflow">{steps.map(({ icon: Icon, title, description }) => (
            <li key={title}><span className="landing-icon"><Icon size={22} aria-hidden="true" /></span><h3>{title}</h3><p>{description}</p></li>
          ))}</ol>
        </section>

        <section className="landing-section landing-section--white" id="categories" aria-labelledby="categories-title">
          <div className="landing-container">
            <header className="section-heading"><h2 id="categories-title">Exemples de missions</h2><p>Quelques idées de projets réalisables sur un format court.</p></header>
            <div className="category-grid">{categories.map(({ icon: Icon, title, description }) => (
              <article key={title}><Icon size={22} aria-hidden="true" /><h3>{title}</h3><p>{description}</p></article>
            ))}</div>
          </div>
        </section>

        <section className="landing-section landing-container faq-layout" id="faq" aria-labelledby="faq-title">
          <header className="section-heading"><h2 id="faq-title">Questions fréquentes</h2><p>Les réponses utiles avant de postuler ou de proposer un projet.</p></header>
          <div className="faq-list">{questions.map(([question, answer]) => (
            <details key={question}><summary>{question}<ChevronDown size={18} aria-hidden="true" /></summary><p>{answer}</p></details>
          ))}</div>
        </section>

        <section className="landing-container landing-final" aria-labelledby="landing-final-title">
          <div className="landing-final-inner">
            <div><h2 id="landing-final-title">Votre prochain projet commence ici</h2><p>Découvrez les missions ou préparez celle de votre entreprise.</p></div>
            <div className="landing-actions">
              <Button href="#missions">Voir les missions <ArrowRight size={16} aria-hidden="true" /></Button>
              <Button href="#publier" variant="outline"><Send size={15} aria-hidden="true" /> Proposer une mission</Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div><a className="brand-link" href="#accueil" aria-label="Accueil StageLik"><Brand /></a><p>Missions étudiantes et projets d’entreprise.</p></div>
          <nav aria-label="Parcours"><strong>Parcours</strong><a href="#missions">Étudiants</a><a href="#publier">Entreprises</a></nav>
          <nav aria-label="Découvrir"><strong>Découvrir</strong><a href="#fonctionnement">Fonctionnement</a><a href="#categories">Exemples de missions</a><a href="#faq">Questions fréquentes</a></nav>
          <nav aria-label="Compte"><strong>Compte</strong>{workspace ? <a href={workspace}>Mon espace</a> : <><a href="#connexion">Connexion</a><a href="#inscription">Créer un compte</a></>}</nav>
        </div>
      </footer>
    </div>
  )
}
