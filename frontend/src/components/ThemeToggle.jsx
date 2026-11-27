import React, { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { getTheme, saveTheme, subscribeToTheme } from '../theme.js'
import { Button } from './ui.jsx'

export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribeToTheme, getTheme) === 'dark'
  const label = dark ? 'Activer le mode clair' : 'Activer le mode sombre'
  return <Button type="button" className="theme-toggle" variant="outline" aria-label={label} title={label}
    onClick={() => saveTheme(dark ? 'light' : 'dark')}>
    {dark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
  </Button>
}
