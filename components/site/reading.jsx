"use client"

import { useEffect, useState } from "react"

// A thin bar under the header that fills as the reader scrolls through the guide.
export function ReadingProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      setProgress(max > 0 ? Math.min(1, scrollY / max) : 0)
    }
    update()
    addEventListener("scroll", update, { passive: true })
    addEventListener("resize", update)
    return () => {
      removeEventListener("scroll", update)
      removeEventListener("resize", update)
    }
  }, [])
  return <div className="reading-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
}

// "On this page": the guide's ## headings, with the one being read highlighted.
export function Toc({ collapsible = false }) {
  const [items, setItems] = useState([])
  const [active, setActive] = useState(null)
  useEffect(() => {
    const headings = [...document.querySelectorAll(".prose h2[id]")]
    // Headings can hold KaTeX maths: keep its rendered HTML and drop the hidden MathML copy.
    const html = (h) => {
      const c = h.cloneNode(true)
      c.querySelectorAll(".katex-mathml").forEach((m) => m.remove())
      return c.innerHTML
    }
    setItems(headings.map((h) => ({ id: h.id, html: html(h) })))
    const onScroll = () => {
      let current = headings[0]?.id ?? null
      for (const h of headings) if (h.getBoundingClientRect().top < 120) current = h.id
      setActive(current)
    }
    onScroll()
    addEventListener("scroll", onScroll, { passive: true })
    return () => removeEventListener("scroll", onScroll)
  }, [])
  if (!items.length) return null
  const list = (
    <ol className="toc-list">
      {items.map((it) => (
        <li key={it.id}>
          <a href={`#${it.id}`} className={it.id === active ? "active" : undefined} aria-current={it.id === active ? "location" : undefined}>
            <span dangerouslySetInnerHTML={{ __html: it.html }} />
          </a>
        </li>
      ))}
    </ol>
  )
  if (collapsible) {
    return (
      <details className="toc-mobile">
        <summary>On this page</summary>
        {list}
      </details>
    )
  }
  return (
    <nav className="toc" aria-label="On this page">
      <p className="sidebar-label">On this page</p>
      {list}
    </nav>
  )
}

// A copy button on every code block, and a label saying which blocks are code and which output.
export function CodeTools() {
  useEffect(() => {
    for (const pre of document.querySelectorAll(".prose pre")) {
      if (pre.querySelector(".copy-button")) continue
      const code = pre.querySelector("code")
      if (!code || code.classList.contains("language-output")) continue
      const button = document.createElement("button")
      button.type = "button"
      button.className = "copy-button"
      button.textContent = "Copy"
      button.setAttribute("aria-label", "Copy code to clipboard")
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(code.innerText)
          button.textContent = "Copied"
        } catch {
          button.textContent = "Press Ctrl+C"
        }
        setTimeout(() => (button.textContent = "Copy"), 1600)
      })
      pre.appendChild(button)
    }
  }, [])
  return null
}
