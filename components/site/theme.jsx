"use client"

import { Moon, Sun } from "./icons"

// Runs in <head> before the first paint, so a stored choice never flashes the other theme.
// With nothing stored, the CSS follows the operating system's setting.
export const themeScript = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement
    const current = root.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    const next = current === "dark" ? "light" : "dark"
    root.dataset.theme = next
    try {
      localStorage.setItem("theme", next)
    } catch {}
  }
  // Both icons are rendered; CSS shows the one for the mode a click switches to.
  return (
    <button type="button" className="icon-button theme-toggle" onClick={toggle} aria-label="Switch between light and dark mode" title="Light / dark mode">
      <Moon className="icon-moon" />
      <Sun className="icon-sun" />
    </button>
  )
}
