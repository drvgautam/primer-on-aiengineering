"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "./icons"

// The series navigation shown beside every page: Welcome, then the guides grouped by part.
// On narrow screens it slides in from the left, opened from the bar under the header.
export function Sidebar({ groups, coming }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const current = (href) => (pathname === href || pathname === href.replace(/\/$/, "") ? "page" : undefined)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === "Escape" && setOpen(false)
    addEventListener("keydown", onKey)
    return () => removeEventListener("keydown", onKey)
  }, [open])

  return (
    <>
      <div className="doc-menubar">
        <button type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="doc-sidebar">
          <Menu width={18} height={18} /> Guides
        </button>
      </div>
      <aside id="doc-sidebar" className={`doc-sidebar${open ? " open" : ""}`} aria-label="Guides">
        <nav className="doc-nav">
          <Link href="/" aria-current={current("/")} className="doc-nav-welcome">
            Welcome
          </Link>
          {groups.map((p) => (
            <div key={p.name} className="doc-nav-group">
              <p className="sidebar-label">{p.name}</p>
              <ol>
                {p.items.map((x) => (
                  <li key={x.slug}>
                    <Link href={`/${x.slug}/`} aria-current={current(`/${x.slug}/`)}>
                      <span className="series-num">{x.guide}</span>
                      {x.short}
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          ))}
          {coming ? <p className="series-coming">{coming} more guides coming</p> : null}
        </nav>
      </aside>
      {open ? <div className="doc-scrim" onClick={() => setOpen(false)} aria-hidden="true" /> : null}
    </>
  )
}
