import React from 'react'

const calendar = new Intl.DateTimeFormat('fr-MA', { dateStyle: 'long' })
const relative = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

export default function MissionPublication({ publishedAt }) {
  const date = publishedAt ? new Date(publishedAt) : null
  if (!date || Number.isNaN(date.getTime())) {
    return <p className="mission-publication">Date de publication non renseignée</p>
  }

  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000))
  let elapsed = 'à l’instant'
  if (minutes >= 1440) elapsed = relative.format(-Math.floor(minutes / 1440), 'day')
  else if (minutes >= 60) elapsed = relative.format(-Math.floor(minutes / 60), 'hour')
  else if (minutes > 0) elapsed = relative.format(-minutes, 'minute')

  return <p className="mission-publication">
    Publiée {elapsed} · <time dateTime={publishedAt}>{calendar.format(date)}</time>
  </p>
}
