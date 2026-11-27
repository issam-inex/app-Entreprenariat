import React from 'react'
import { initials } from '../utils/initials.js'

export function Button({ href, variant = 'primary', className = '', children, ...props }) {
  const classes = ['ui-button', `ui-button--${variant}`, className].filter(Boolean).join(' ')
  if (href) return <a href={href} className={classes} {...props}>{children}</a>
  return <button type="button" className={classes} {...props}>{children}</button>
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={`ui-badge ui-badge--${tone}`}>{children}</span>
}

export function Avatar({ name, photoUrl, className = '' }) {
  return <span className={`ui-avatar ${className}`.trim()} aria-hidden="true">
    {initials(name)}
    {photoUrl && <img key={photoUrl} src={photoUrl} alt="" onError={event => { event.currentTarget.hidden = true }} />}
  </span>
}

export function Notice({ tone = 'info', children }) {
  return <div className={`ui-notice ui-notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>
}

export function Skeleton({ label }) {
  return <div className="ui-skeleton" role="status">
    <span className="sr-only">{label}</span>
    <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
  </div>
}

export function SkipLink() {
  return <a className="skip-link" href="#contenu" onClick={event => {
    const main = document.getElementById('contenu')
    if (!main) return
    event.preventDefault()
    main.focus()
    main.scrollIntoView({ block: 'start' })
  }}>Aller au contenu</a>
}
