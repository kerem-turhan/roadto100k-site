import { useEffect, useState } from 'react'

/**
 * Toggles the .dark class set pre-paint by the inline script in index.html.
 *
 * The initial state cannot read the DOM: this component is also rendered at
 * build time, where there is no document, and reading it during hydration would
 * disagree with the prerendered HTML for anyone whose theme is not the default.
 * So it starts light and corrects itself after mount — the class on <html> is
 * already right by then, only this button's label lags by a frame.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

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
      /* border: --rule is 1.33:1 against paper, and WCAG 2.1 §1.4.11 wants 3:1
         for a control's boundary. --ink-muted is 5.49:1 and palette-legal. */
      className="min-h-11 cursor-pointer rounded-sm border border-ink-muted px-3.5 py-2 font-mono text-xs tracking-[0.2em] text-ink-muted uppercase transition-colors hover:text-ink"
    >
      {dark ? 'Light' : 'Dark'}
    </button>
  )
}
