import { expect, test } from '@playwright/test'

test('joint des fichiers au brouillon de mission', async ({ page }) => {
  await page.route('**/api/v1/auth/me', route => route.fulfill({ json: {
    account: { id: 100, role: 'company', name: 'Beta', status: 'verified', email_verified_at: '2026-01-01' },
  } }))
  await page.route('**/sanctum/csrf-cookie', route => route.fulfill({ status: 204 }))
  await page.route('**/api/v1/missions', route => {
    if (route.request().method() === 'POST') {
      expect(route.request().postData()).toContain('name="attachments[]"; filename="consignes.pdf"')
      return route.fulfill({ status: 201, json: { id: 1, status: 'draft' } })
    }
    return route.fulfill({ json: { missions: [], applications: [] } })
  })
  await page.goto('/#publier')
  await page.getByLabel('Titre de la mission').fill('Création graphique')
  await page.getByLabel('Description', { exact: true }).fill('Créer une affiche')
  await page.getByLabel('Durée').fill('Une semaine')
  await page.getByLabel('Compétences demandées').fill('Design')
  await page.getByLabel('Ajouter des pièces jointes').setInputFiles({
    name: 'consignes.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4'),
  })
  await page.getByRole('button', { name: 'Enregistrer le brouillon' }).click()
  await expect(page.getByText(/Brouillon enregistré/)).toBeVisible()
})
import { strToU8, zipSync } from 'fflate'

const brief = [
  'Titre : Créer un tableau de bord',
  'Contexte : Centraliser le suivi des commandes.',
  'Objectifs : Afficher les commandes à traiter.',
  'Durée',
  '2 semaines',
  'Compétences : React, Laravel',
]

function pdf(lines) {
  const stream = `BT /F1 12 Tf 40 760 Td ${lines.map(
    (line, index) => `${index ? '0 -24 Td ' : ''}(${line}) Tj`,
  ).join(' ')} ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ]
  let document = '%PDF-1.4\n'
  const offsets = objects.map((object, index) => {
    const offset = document.length
    document += `${index + 1} 0 obj\n${object}\nendobj\n`
    return offset
  })
  document += `xref\n0 6\n0000000000 65535 f \n${offsets.map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${document.length}\n%%EOF\n`
  return Buffer.from(document, 'ascii')
}

const files = [
  { name: 'cahier.md', mimeType: 'text/markdown', buffer: Buffer.from(brief.join('\n')) },
  { name: 'cahier.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from(zipSync({ 'word/document.xml': strToU8(`<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${brief.map(line => `<w:p><w:r><w:t>${line}</w:t></w:r></w:p>`).join('')}</w:body></w:document>`) })) },
  { name: 'cahier.pdf', mimeType: 'application/pdf', buffer: pdf(brief.map(line => line.normalize('NFD').replace(/\p{Diacritic}/gu, ''))) },
]

for (const file of files) {
  test(`préremplit un nouveau brouillon depuis ${file.name}`, async ({ page }) => {
    await page.route('**/api/v1/auth/me', route => route.fulfill({ json: {
      account: { id: 100, role: 'company', name: 'Entreprise test', status: 'verified', email_verified_at: '2026-01-01' },
    } }))
    await page.route('**/api/v1/missions', route => route.fulfill({ json: { missions: [], applications: [] } }))
    const mutations = []
    page.on('request', request => {
      if (request.method() !== 'GET' && request.url().includes('/api/v1/missions')) mutations.push(request.method())
    })
    await page.goto('/#publier')
    await expect(page.getByLabel('Titre de la mission')).toHaveValue('')
    const chooser = page.waitForEvent('filechooser')
    await page.getByRole('button', { name: 'Importer un cahier des charges' }).click()
    await (await chooser).setFiles(file)
    await expect(page.getByLabel('Titre de la mission')).toHaveValue(/Cr.er un tableau de bord/)
    await expect(page.getByLabel('Description')).toHaveValue(/Centraliser/)
    await expect(page.getByLabel('Objectifs')).toHaveValue(/^Afficher/)
    await expect(page.getByLabel('Durée')).toHaveValue('2 semaines')
    await expect(page.getByLabel('Compétences demandées')).toHaveValue('React, Laravel')
    expect(mutations).toEqual([])
  })
}

test('extrait les mots-clés d’un document sans rubriques et sans appel API', async ({ page }) => {
  await page.route('**/api/v1/auth/me', route => route.fulfill({ json: {
    account: { id: 100, role: 'company', name: 'Entreprise test', status: 'pending', email_verified_at: null },
  } }))
  await page.route('**/api/v1/missions', route => route.fulfill({ json: { missions: [], applications: [] } }))
  const text = 'L’entreprise souhaite un tableau de suivi des commandes en deux semaines. Utilisez React et Laravel. Livrer un prototype déployable.'
  const mutations = []
  page.on('request', request => {
    if (request.method() !== 'GET' && request.url().includes('/api/v1/missions')) mutations.push(request.url())
  })
  await page.goto('/#publier')
  const chooser = page.waitForEvent('filechooser')
  await page.getByRole('button', { name: 'Analyser avec l’IA' }).click()
  await (await chooser).setFiles({ name: 'cahier.txt', mimeType: 'text/plain', buffer: Buffer.from(text) })
  await expect(page.getByLabel('Titre de la mission')).toHaveValue('Un tableau de suivi des commandes')
  await expect(page.getByLabel('Durée')).toHaveValue('deux semaines')
  await expect(page.getByLabel('Livrables attendus')).toHaveValue('Livrer un prototype déployable.')
  await expect(page.getByLabel('Compétences demandées')).toHaveValue('React, Laravel')
  expect(mutations).toEqual([])
})
