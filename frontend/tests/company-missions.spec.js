import { expect, test } from '@playwright/test'

test('affiche la photo de l’étudiant retenu dans le suivi entreprise', async ({ page }) => {
  const photo = '/api/v1/missions/12/applications/3/profile/photo'
  await page.route('**/api/v1/auth/me', route => route.fulfill({ json: {
    account: { id: 1, name: 'Beta', role: 'company', status: 'verified', email_verified_at: '2026-01-01' },
  } }))
  await page.route('**/api/v1/missions/work', route => route.fulfill({ json: {
    missions: [{ id: 12, title: 'Prototype', student: 'Issam', student_photo_url: photo, duration: 'Deux semaines' }],
  } }))
  await page.route(`**${photo}`, route => route.fulfill({
    contentType: 'image/png',
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBXsAAAAASUVORK5CYII=', 'base64'),
  }))
  await page.goto('/#missions-en-cours')
  const mission = page.locator('article').filter({ hasText: 'Étudiant retenu : Issam' })
  await expect(mission.locator('.ui-avatar img')).toBeVisible()
  await expect(mission.locator('.ui-avatar img')).toHaveAttribute('src', photo)
})

test('l’administrateur ouvre le dossier depuis une liste sans données privées', async ({ page }) => {
  let companies = [{ id: 10, name: 'Beta', status: 'pending' }]
  await page.route('**/api/v1/auth/me', route => route.fulfill({ json: {
    account: { id: 2, name: 'Admin', role: 'admin', email_verified_at: '2026-01-01' },
  } }))
  await page.route('**/api/v1/admin/companies?page=1', route => route.fulfill({ json: {
    data: companies, last_page: 1,
  } }))
  await page.route('**/api/v1/admin/companies/10/verifications?page=1', route => route.fulfill({ json: {
    company: { id: 10, name: 'Beta', status: 'pending' },
    data: [{ id: 20, legal_name: 'Beta SARL', status: 'pending', is_current: true, ice: '123456789012345' }],
    meta: { last_page: 1 },
  } }))
  await page.goto('/#administration')
  await expect(page.getByText('En attente', { exact: true }).last()).toBeVisible()
  await expect(page.getByText('123456789012345')).toHaveCount(0)
  await page.getByRole('button', { name: 'Voir le détail de Beta' }).click()
  await expect(page.getByText('123456789012345')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Enregistrer la décision' })).toBeVisible()
  await page.getByRole('button', { name: 'Retour aux entreprises' }).click()
  await expect(page.getByRole('button', { name: 'Voir le détail de Beta' })).toBeVisible()
  await page.route('**/sanctum/csrf-cookie', route => route.fulfill({ status: 204 }))
  await page.route('**/api/v1/admin/companies/10', route => {
    expect(route.request().method()).toBe('DELETE')
    companies = []
    return route.fulfill({ status: 204 })
  })
  const remove = page.getByRole('button', { name: 'Supprimer Beta' })
  page.once('dialog', dialog => dialog.dismiss())
  await remove.click()
  await expect(remove).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  await remove.click()
  await expect(page.getByText('Entreprise supprimée.')).toBeVisible()
  await expect(remove).toHaveCount(0)
})

test('un étudiant soumet un livrable puis voit sa validation', async ({ page }) => {
  const mission = { id: 12, title: 'Prototype Alpha', company: 'Alpha', duration: 'Deux semaines' }
  await page.route('**/api/v1/auth/me', route => route.fulfill({ json: {
    account: { id: 10, name: 'Issam', role: 'student', email_verified_at: '2026-01-01' },
  } }))
  await page.route('**/api/v1/missions', route => route.fulfill({ json: { missions: [], applications: [] } }))
  await page.route('**/sanctum/csrf-cookie', route => route.fulfill({ status: 204 }))
  await page.route('**/api/v1/missions/work', route => route.fulfill({ json: { missions: [mission] } }))
  await page.route('**/api/v1/missions/12/delivery', route => {
    expect(route.request().headers()['content-type']).toContain('multipart/form-data; boundary=')
    expect(route.request().postData()).toContain('filename="rapport.pdf"')
    mission.has_attachment = true
    mission.delivery_submitted_at = '2026-11-26T10:00:00Z'
    return route.fulfill({ json: { message: 'Livrable soumis.' } })
  })
  await page.goto('/#missions-en-cours')
  const step = page.locator('[aria-current="step"]')
  await expect(step).toHaveText('En cours')
  const submit = page.getByRole('button', { name: 'Soumettre le livrable' })
  const attachment = page.getByLabel('Pièce jointe')
  const url = page.getByLabel('Lien du livrable')
  await submit.click()
  await expect(page.getByRole('alert')).toHaveText('Ajoutez au moins une pièce jointe ou un lien.')
  await expect(attachment).toHaveAttribute('aria-invalid', 'true')
  await expect(url).toHaveAttribute('aria-invalid', 'true')
  await url.fill('example.com')
  await expect(page.getByRole('alert')).toContainText('Lien invalide')
  await url.clear()
  await attachment.setInputFiles({ name: 'rapport.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('test') })
  await expect(page.getByRole('alert')).toContainText('Format non accepté')
  await attachment.setInputFiles({ name: 'rapport.pdf', mimeType: 'application/pdf', buffer: Buffer.alloc(2 * 1024 * 1024 + 1) })
  await expect(page.getByRole('alert')).toContainText('Fichier trop volumineux')
  await attachment.setInputFiles({
    name: 'rapport.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
  })
  await expect(attachment).toHaveAttribute('aria-invalid', 'false')
  await submit.click()
  await expect(step).toHaveText('Livrable soumis')
  const downloadButton = page.getByRole('button', { name: 'Télécharger la pièce jointe' })
  await page.reload()
  await page.route('**/api/v1/missions/12/delivery/attachment', route => route.fulfill({
    headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': 'attachment; filename=livrable-12.pdf' },
    body: '%PDF-1.4',
  }))
  const download = page.waitForEvent('download')
  await downloadButton.click()
  expect((await download).suggestedFilename()).toBe('livrable-12.pdf')
  mission.completed_at = '2026-11-26T11:00:00Z'
  await page.reload()
  await expect(step).toHaveText('Terminée')
})

test('sépare les brouillons des candidatures et ouvre le formulaire de contact', async ({ page }) => {
  const application = { missionId: 2, studentId: 3, name: 'Étudiante test', message: 'Je suis intéressée.', status: 'submitted' }
  await page.route('**/sanctum/csrf-cookie', route => route.fulfill({ status: 204 }))
  await page.route('**/api/v1/missions/2/applications/3/reject', route => {
    expect(route.request().method()).toBe('POST')
    application.status = 'rejected'
    return route.fulfill({ json: {} })
  })
  await page.route('**/api/v1/auth/me', route => route.fulfill({ json: {
    account: { id: 1, name: 'Alpha', role: 'company', status: 'verified', email_verified_at: '2026-01-01' },
  } }))
  await page.route('**/api/v1/missions', route => route.fulfill({ json: {
    missions: [
      { id: 1, title: 'Brouillon Alpha', status: 'draft', category: 'design' },
      { id: 2, title: 'Mission publique', status: 'published', category: 'development' },
      { id: 3, title: 'Mission attribuée', status: 'occupied', category: 'design' },
    ],
    applications: [application],
  } }))
  await page.goto('/#mes-missions')
  await expect(page.getByRole('heading', { name: 'Brouillon Alpha' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Publier la mission' })).toBeVisible()
  const available = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Mission publique' }) })
  await expect(available.getByRole('button', { name: 'Modifier la mission' })).toBeDisabled()
  await expect(available.getByRole('button', { name: 'Supprimer la mission' })).toHaveAccessibleDescription(/déjà reçu des candidatures/)
  await page.getByLabel('Filtrer par type').selectOption('design')
  await expect(page.getByRole('heading', { name: 'Mission publique' })).toHaveCount(0)
  await page.getByLabel('Filtrer par statut').selectOption('occupied')
  await expect(page.getByRole('heading', { name: 'Mission attribuée' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Brouillon Alpha' })).toHaveCount(0)
  await expect(page.getByText('Étudiante test')).toHaveCount(0)
  await page.getByRole('button', { name: 'Candidatures reçues' }).click()
  await expect(page.getByRole('heading', { name: 'Brouillon Alpha' })).toHaveCount(0)
  await expect(page.getByText('Étudiante test', { exact: true })).toBeVisible()
  await page.route('**/api/v1/missions/2/applications/3/profile', route => route.fulfill({ json: {
    name: 'Étudiante test', bio: 'Illustratrice', skills: 'Figma', links: [{ name: 'Portfolio', url: 'https://example.test' }],
  } }))
  await page.getByRole('button', { name: 'Voir le profil de Étudiante test' }).click()
  await expect(page.getByText('Illustratrice')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Portfolio' })).toHaveAttribute('href', 'https://example.test')
  await page.getByRole('button', { name: 'Retour aux candidatures' }).click()
  await expect(page.getByRole('button', { name: 'Contacter', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Contacter par e-mail' }).click()
  await expect(page.getByRole('textbox', { name: 'Message pour Étudiante test' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Envoyer par e-mail' })).toBeVisible()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('button', { name: 'Refuser la candidature' }).click()
  await expect(page.getByText('Refusée', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Accepter la candidature' })).toHaveCount(0)
})

test('un étudiant recherche une entreprise puis consulte ses missions', async ({ page }) => {
  const photoUrl = '/api/v1/companies/1/photo'
  await page.route(`**${photoUrl}`, route => route.fulfill({
    contentType: 'image/png',
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBXsAAAAASUVORK5CYII=', 'base64'),
  }))
  await page.route('**/api/v1/auth/me', route => route.fulfill({ json: {
    account: { id: 10, name: 'Étudiant test', role: 'student', email_verified_at: '2026-01-01' },
  } }))
  await page.route('**/api/v1/missions', route => route.fulfill({ json: {
    companies: [{ id: 1, name: 'Atelier Élan', city: 'Rabat', sector: 'Design', description: 'Studio créatif.', website: 'https://example.test', photo_url: photoUrl }, { id: 2, name: 'Alpha' }],
    missions: [{ id: 12, companyId: 1, company: 'Atelier Élan', title: 'Créer un prototype', status: 'occupied' }],
    applications: [{ missionId: 13, companyId: 1, company: 'Atelier Élan', title: 'Créer une affiche', status: 'submitted' }],
  } }))
  await page.route('**/api/v1/missions/work', route => route.fulfill({ json: {
    missions: [{ id: 14, title: 'Mettre à jour une maquette', company: 'Atelier Élan', company_photo_url: photoUrl }],
  } }))
  await page.goto('/#entreprises')
  await expect(page.getByRole('heading', { name: 'Alpha', exact: true })).toBeVisible()
  await page.getByRole('searchbox', { name: 'Rechercher une entreprise' }).fill('elan')
  await expect(page.getByRole('heading', { name: 'Alpha', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Voir le profil' }).click()
  await expect(page.getByText('Studio créatif.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Visiter le site web' })).toHaveAttribute('href', 'https://example.test')
  await expect(page.getByRole('heading', { name: 'Créer un prototype' })).toBeVisible()
  await expect(page.locator('.company-logo img')).toBeVisible()
  await expect(page.locator('.company-logo img')).toHaveAttribute('src', photoUrl)
  await expect(page.getByRole('button', { name: 'Mission occupée' })).toBeDisabled()
  await page.getByRole('button', { name: 'Voir les détails' }).click()
  await expect(page.getByRole('button', { name: 'Postuler' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Retour aux entreprises' }).click()
  await expect(page.getByRole('searchbox')).toHaveValue('elan')
  await page.getByRole('button', { name: 'Mes candidatures' }).click()
  await expect(page.locator('.company-logo img')).toBeVisible()
  await expect(page.locator('.company-logo img')).toHaveAttribute('src', photoUrl)
  await page.getByRole('button', { name: 'Mes missions en cours' }).click()
  await expect(page.locator('.company-logo img')).toBeVisible()
  await expect(page.locator('.company-logo img')).toHaveAttribute('src', photoUrl)
})
