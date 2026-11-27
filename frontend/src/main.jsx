import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { initializeTheme } from './theme.js'
import '@fontsource-variable/inter'
import './styles/tailwind.css'
import './styles/design-system.css'
import './styles/global.css'
import './styles/landing.css'
import './styles/workspace.css'

const root = document.getElementById('root')
if (!root) throw new Error('Point de montage StageLik introuvable.')
initializeTheme()

createRoot(root).render(
  <QueryClientProvider client={new QueryClient()}>
    <HashRouter><App /></HashRouter>
  </QueryClientProvider>,
)
