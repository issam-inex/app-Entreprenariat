import React, { useState } from 'react'
import { Button, Notice } from '../components/ui.jsx'
import { request } from '../services/api.js'

export default function AttachmentDownload({ path, label = 'Télécharger la pièce jointe' }) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  async function download() {
    setError('')
    setDownloading(true)
    try {
      const { data, headers } = await request(path, 'GET', undefined, 'blob')
      const filename = /filename="?([a-z0-9.-]+)"?(?:;|$)/i.exec(headers['content-disposition'] ?? '')?.[1]
      if (!filename) throw new Error('Téléchargement indisponible.')

      const url = URL.createObjectURL(data)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000)
    } catch (failure) {
      setError(failure.status === 401
        ? 'Reconnectez-vous pour télécharger la pièce jointe.'
        : 'Impossible de télécharger la pièce jointe. Actualisez la mission pour vérifier son état.')
    } finally {
      setDownloading(false)
    }
  }

  return <>
    <Button variant="outline" disabled={downloading} onClick={download}>
      {downloading ? 'Téléchargement…' : label}
    </Button>
    {error && <Notice tone="error">{error}</Notice>}
  </>
}
