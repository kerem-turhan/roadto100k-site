import { useState } from 'react'

/** Toggles the .dark class set pre-paint by the inline script in index.html. */
export function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    setDark(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="min-h-11 cursor-pointer rounded-sm border border-rule px-3.5 py-2 font-mono text-xs tracking-[0.2em] text-ink-muted uppercase transition-colors hover:border-ink-muted hover:text-ink"
    >
      {dark ? 'Light' : 'Dark'}
    </button>
  )
}
