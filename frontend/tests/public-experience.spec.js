import { expect, test } from '@playwright/test'

for (const role of ['student', 'company']) {
  test(`affiche la photo du compte ${role} sur l’accueil`, async ({ page }) => {
    const photo = '/api/v1/companies/12/photo'
    await page.route('**/api/v1/auth/me', route => route.fulfill({ json: {
      account: { id: 12, name: 'Compte test', role, status: 'verified', email_verified_at: '2026-01-01' },
    } }))
    await page.route(`**/api/v1/${role}/profile`, route => route.fulfill({ json: { complete: true, photo_url: photo } }))
    await page.route(`**${photo}`, route => route.fulfill({
      contentType: 'image/png',
      body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBXsAAAAASUVORK5CYII=', 'base64'),
    }))
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/#accueil')
    const profile = page.getByRole('link', { name: 'Voir le profil de Compte test' })
    await expect(profile.locator('img')).toBeVisible()
    await expect(profile.locator('img')).toHaveAttribute('src', photo)
    await profile.click()
    await expect(page.getByRole('heading', { name: role === 'student' ? 'Mon profil' : 'Profil entreprise' })).toBeVisible()
  })
}

test('suit le thème système jusqu’à ce que la personne choisisse un thème', async ({ page }) => {
  await page.route('**/api/v1/auth/me', route => route.fulfill({ json: { account: null } }))
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/#accueil')
  const root = page.locator('html')
  await expect(root).toHaveCSS('color-scheme', 'dark')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(root).toHaveCSS('color-scheme', 'light')
  await page.getByRole('button', { name: 'Activer le mode sombre' }).click()
  await page.reload()
  await expect(root).toHaveCSS('color-scheme', 'dark')
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#101827')
})

test('mémorise le thème et partage le choix entre les pages publiques et l’espace de travail', async ({ page }) => {
  let account = null
  await page.route('**/api/v1/auth/me', route => route.fulfill({ json: { account } }))
  await page.route('**/api/v1/missions', route => route.fulfill({ json: { missions: [], applications: [] } }))
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto('/#accueil')

  const root = page.locator('html')
  await page.getByRole('button', { name: 'Activer le mode sombre' }).click()
  await expect(root).toHaveCSS('color-scheme', 'dark')
  await expect(page.locator('.product-window')).toHaveCSS('background-color', 'rgb(23, 34, 53)')
  const brand = page.locator('.public-navbar .brand')
  await expect(brand).toHaveCSS('color', 'rgb(20, 35, 67)')
  await expect(brand.locator('.stage-mark i').nth(2)).toHaveCSS('background-color', 'rgb(25, 121, 81)')
  await page.reload()
  await expect(root).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('link', { name: 'Connexion', exact: true }).first().click()
  await expect(page.getByRole('button', { name: 'Activer le mode clair' })).toBeVisible()

  account = { id: 1, name: 'Issam', role: 'student', status: 'approved', email_verified_at: '2026-01-01' }
  await page.goto('/#missions')
  await page.reload()
  await expect(page.locator('.workspace-shell')).toBeVisible()
  await page.getByRole('button', { name: 'Activer le mode clair' }).click()
  await expect(root).toHaveCSS('color-scheme', 'light')
  await page.reload()
  await expect(root).toHaveAttribute('data-theme', 'light')
})

for (const width of [375, 768, 1024, 1440, 1920]) {
  test(`accueil responsive à ${width} px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width < 850 ? 900 : 1000 })
    const runtimeErrors = []
    page.on('pageerror', error => runtimeErrors.push(error.message))
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('De l’expérience concrète.')
    await expect(page.getByRole('banner').getByRole('link', { name: 'Connexion' })).toBeVisible()
    for (const section of ['Comment ça marche ?', 'Exemples de missions', 'Questions fréquentes']) {
      await expect(page.getByRole('heading', { name: section, exact: true })).toBeVisible()
    }
    await page.evaluate(() => document.fonts.ready)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
    const screenshot = await page.screenshot({ path: testInfo.outputPath(`accueil-${width}.png`), fullPage: true })
    await testInfo.attach('Accueil', { body: screenshot, contentType: 'image/png' })
    expect(runtimeErrors).toEqual([])
  })
}

test('menu mobile, ancres, FAQ et accès aux comptes', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 850 })
  await page.goto('/')
  const menu = page.getByRole('button', { name: 'Ouvrir le menu' })
  await menu.click()
  const navigation = page.getByRole('navigation', { name: 'Navigation principale' })
  await expect(navigation.getByRole('link', { name: 'Étudiants et entreprises' })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(menu).toBeFocused()
  await expect(navigation).toBeHidden()
  await menu.click()
  await navigation.getByRole('link', { name: 'Comment ça marche' }).click()
  await expect(page).toHaveURL(/#fonctionnement$/)
  await expect(page.getByRole('heading', { name: 'Comment ça marche ?' })).toBeInViewport()
  await expect(navigation).toBeHidden()
  const question = page.getByText('Qui peut postuler à une mission ?', { exact: true })
  await question.click()
  await expect(page.getByText('Les étudiants peuvent postuler', { exact: false })).toBeVisible()
  await page.getByRole('banner').getByRole('link', { name: 'Connexion' }).click()
  await expect(page.getByRole('heading', { name: 'Se connecter' })).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('connexion-375.png'), fullPage: true })
  await page.getByRole('link', { name: 'Mot de passe oublié' }).click()
  await expect(page.getByRole('heading', { name: 'Mot de passe oublié' })).toBeVisible()
  await page.goto('/#inscription')
  await expect(page.getByRole('heading', { name: 'Créer un compte' })).toBeVisible()
  await page.getByRole('radio', { name: 'Entreprise' }).check()
  await expect(page.getByLabel('E-mail professionnel')).toBeVisible()
})

test('Laravel répond derrière le proxy Vite', async ({ request, baseURL }) => {
  const response = await request.get('/api/v1/auth/me', { headers: { Accept: 'application/json', Referer: baseURL + '/' } })
  expect(response.ok()).toBe(true)
  expect(await response.json()).toEqual({ account: null })
})

test('layout entreprise, chargement et affichage d’une erreur API', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 960 })
  await page.route('**/api/v1/auth/me', route => route.fulfill({ json: {
    account: { id: 1, role: 'company', name: 'Entreprise exemple', status: 'verified', email_verified_at: '2026-01-01' },
  } }))
  let finishRequest
  const pending = new Promise(resolve => { finishRequest = resolve })
  await page.route('**/api/v1/missions', async route => {
    await pending
    await route.fulfill({ status: 503, json: { message: 'Le service des missions est indisponible.' } })
  })
  await page.goto('/#candidatures')
  await expect(page.getByRole('heading', { name: 'Candidatures reçues' })).toBeVisible()
  await expect(page.getByText('Chargement des missions…', { exact: true })).toBeAttached()
  finishRequest()
  await expect(page.getByRole('alert')).toContainText('Le service des missions est indisponible.')
  await expect(page.getByRole('button', { name: 'Candidatures reçues' })).toHaveAttribute('aria-current', 'page')
  await page.screenshot({ path: testInfo.outputPath('espace-entreprise-erreur-1440.png'), fullPage: true })
  await page.setViewportSize({ width: 375, height: 850 })
  await expect(page.getByRole('button', { name: 'Se déconnecter' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)
  await page.screenshot({ path: testInfo.outputPath('espace-entreprise-erreur-375.png'), fullPage: true })
})
