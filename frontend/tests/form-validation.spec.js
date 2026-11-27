import { expect, test } from '@playwright/test'

test('l’étudiant complète son profil à partir du rappel', async ({ page }) => {
  const profile = { complete: false }
  await page.route('**/api/v1/auth/me', route => route.fulfill({ json: {
    account: { id: 10, name: 'Issam', role: 'student', email_verified_at: '2026-01-01' },
  } }))
  await page.route('**/api/v1/missions', route => route.fulfill({ json: { missions: [], applications: [] } }))
  await page.route('**/sanctum/csrf-cookie', route => route.fulfill({ status: 204 }))
  await page.route('**/api/v1/student/profile', route => {
    if (route.request().method() === 'POST') {
      expect(route.request().postData()).toContain('filename="portrait.png"')
      expect(route.request().postData()).toContain('https://github.com/issam')
      Object.assign(profile, { bio: 'Étudiant en design', skills: 'Figma', links: [{ name: 'GitHub', url: 'https://github.com/issam' }], complete: true })
    }
    return route.fulfill({ json: profile })
  })
  await page.goto('/#missions')
  await page.getByRole('button', { name: 'Continuer la configuration' }).click()
  await page.getByLabel('Bio').fill('Étudiant en design')
  await page.getByLabel('Compétences').fill('Figma')
  await expect(page.getByLabel('Nom de la plateforme')).toHaveCount(0)
  await page.getByRole('button', { name: 'Ajouter un lien' }).click()
  await page.getByLabel('Nom de la plateforme').fill('GitHub')
  await page.getByLabel('Adresse du lien').fill('github.com/issam')
  const save = page.getByRole('button', { name: 'Enregistrer mon profil' })
  await save.click()
  await expect(page.getByLabel('Adresse du lien')).toHaveAttribute('aria-invalid', 'true')
  await page.getByLabel('Adresse du lien').fill('https://github.com/issam')
  await page.getByRole('button', { name: 'Ajouter un lien' }).click()
  await expect(page.getByLabel('Nom de la plateforme')).toHaveCount(2)
  await page.getByRole('button', { name: 'Retirer le lien 2' }).click()
  const chooser = page.waitForEvent('filechooser')
  await page.locator('.profile-photo-pencil').click()
  await (await chooser).setFiles({
    name: 'portrait.png', mimeType: 'image/png', buffer: Buffer.from('photo de test'),
  })
  await save.click()
  await expect(page.getByText('Profil enregistré.')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Bio')).toHaveValue('Étudiant en design')
  await expect(page.getByLabel('Nom de la plateforme')).toHaveValue('GitHub')
  await page.getByRole('button', { name: 'Missions disponibles' }).click()
  await expect(page.getByText('Votre profil est incomplet.')).toHaveCount(0)
})

test('affiche les erreurs de saisie et de serveur dans le formulaire de compte', async ({ page }) => {
  await page.route('**/api/v1/auth/me', route => route.fulfill({ json: { account: null } }))
  await page.route('**/sanctum/csrf-cookie', route => route.fulfill({ status: 204 }))
  let attempts = 0
  await page.route('**/api/v1/auth/register', route => {
    attempts += 1
    return route.fulfill({ status: 409, json: { message: 'Cette adresse e-mail est déjà utilisée.' } })
  })
  await page.goto('/#inscription')

  const name = page.getByLabel('Nom complet')
  const email = page.getByLabel('Adresse e-mail')
  const password = page.getByLabel('Mot de passe (10 caractères minimum)')
  const submit = page.getByRole('button', { name: 'Créer mon compte' })
  await submit.click()
  await expect(name).toBeFocused()
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  await name.fill('Étudiant test')
  await email.fill('adresse-invalide')
  await password.fill('court')
  await expect(email).toHaveAccessibleDescription('Saisissez une adresse e-mail valide.')
  await expect(password).toHaveAccessibleDescription('Saisissez au moins 10 caractères.')
  await submit.click()
  expect(attempts).toBe(0)

  await email.fill('etudiant@example.test')
  await password.fill('motdepasse-test')
  await submit.click()
  await expect(email).toHaveAccessibleDescription('Cette adresse e-mail est déjà utilisée.')
  await email.fill('autre@example.test')
  await expect(email).toHaveAttribute('aria-invalid', 'false')
})

test('signale les champs obligatoires et le format du dossier de vérification', async ({ page }) => {
  await page.route('**/api/v1/auth/me', route => route.fulfill({ json: {
    account: { id: 100, role: 'company', name: 'Entreprise test', status: 'pending', email_verified_at: '2026-01-01' },
  } }))
  await page.route('**/api/v1/missions', route => route.fulfill({ json: { missions: [], applications: [] } }))
  await page.route('**/api/v1/company/verifications?page=1', route => route.fulfill({ json: { data: [], meta: { last_page: 1 } } }))
  await page.goto('/#verification')

  const ice = page.getByLabel('ICE (15 chiffres)')
  const document = page.getByLabel('Justificatif légal (PDF, 10 Mo maximum)')
  await page.getByRole('button', { name: 'Soumettre le dossier' }).click()
  await expect(document).toHaveAccessibleDescription('Ajoutez le fichier demandé.')
  await ice.fill('123')
  await expect(ice).toHaveAccessibleDescription('L’ICE doit comporter exactement 15 chiffres.')
  await document.setInputFiles({ name: 'justificatif.txt', mimeType: 'text/plain', buffer: Buffer.from('test') })
  await expect(document).toHaveAccessibleDescription('Choisissez un fichier PDF.')
  await ice.fill('123456789012345')
  await expect(ice).toHaveAttribute('aria-invalid', 'false')
})
