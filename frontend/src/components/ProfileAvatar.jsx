import React from 'react'
import { Avatar, Button } from './ui.jsx'

export default function ProfileAvatar({ name, photoUrl, href, className }) {
  const avatar = <Avatar name={name} photoUrl={photoUrl} className={className} />
  if (!href) return avatar

  return <Button href={href} variant="ghost" className="profile-avatar-link" aria-label={`Voir le profil de ${name}`} title={`Voir le profil de ${name}`}>
    {avatar}
  </Button>
}
