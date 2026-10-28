"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { useRouter } from "next/navigation"
import MiniSearch from "minisearch"
import { Search as SearchIcon } from "./icons"

// The index is out/search-index.json, written after `next build` by tools/build-search-index.mjs.
// It is fetched the first time the dialog opens, so pages that never search never load it.
const INDEX_URL = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/search-index.json`
let loading = null
function loadIndex() {
  loading ??= fetch(INDEX_URL)
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status))
      return r.json()
    })
    .then((docs) => {
      const ms = new MiniSearch({
        fields: ["heading", "page", "text", "code"],
        storeFields: ["slug", "guide", "page", "heading", "anchor", "level", "text", "code"],
        searchOptions: { boost: { heading: 4, page: 2, code: 0.5 }, prefix: true, fuzzy: 0.2, combineWith: "AND" },
      })
      ms.addAll(docs)
      const guides = docs.filter((d) => d.level === 1)
      return { ms, guides }
    })
    .catch((e) => {
      loading = null
      throw e
    })
  return loading
}

const href = (r) => `/${r.slug}/${r.anchor ? `#${r.anchor}` : ""}`
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// A window of the section's prose around the first matched term (the code, if only the code
// matched), split into plain and marked pieces so React escapes everything.
function preview(r) {
  const inText = r.terms.some((t) => r.text.toLowerCase().includes(t))
  return snippet(inText || !r.code ? r.text : r.code, r.terms)
}

function snippet(text, terms, width = 160) {
  if (!terms.length) return [{ s: text.slice(0, width) + (text.length > width ? "…" : "") }]
  const re = new RegExp(`(${terms.map(escapeRe).sort((a, b) => b.length - a.length).join("|")})`, "gi")
  const first = text.search(re)
  const from = Math.max(0, (first < 0 ? 0 : first) - 50)
  let cut = text.slice(from, from + width)
  if (from > 0) cut = "…" + cut.replace(/^\S*\s/, "")
  if (from + width < text.length) cut = cut.replace(/\s\S*$/, "") + "…"
  // split() with a capturing group puts the matches at the odd positions
  return cut.split(re).map((s, i) => ({ s, mark: i % 2 === 1 })).filter((p) => p.s)
}

function Marked({ parts }) {
  return parts.map((p, i) => (p.mark ? <mark key={i}>{p.s}</mark> : <span key={i}>{p.s}</span>))
}

export function SearchButton() {
  const [open, setOpen] = useState(false)
  const [mac, setMac] = useState(false)
  const button = useRef(null)

  useEffect(() => {
    setMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent))
    const onKey = (e) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === "/" && !typing) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const close = () => {
    setOpen(false)
    button.current?.focus()
  }

  return (
    <>
      <button ref={button} type="button" className="search-button" onClick={() => setOpen(true)} onMouseEnter={() => loadIndex().catch(() => {})} aria-label="Search the guides" aria-haspopup="dialog">
        <SearchIcon width={16} height={16} />
        <span className="search-button-label">Search</span>
        <kbd className="search-button-keys">{mac ? "⌘" : "Ctrl"} K</kbd>
      </button>
      {open ? createPortal(<SearchDialog onClose={close} />, document.body) : null}
    </>
  )
}

function SearchDialog({ onClose }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [index, setIndex] = useState(null)
  const [failed, setFailed] = useState(false)
  const [active, setActive] = useState(0)
  const input = useRef(null)
  const list = useRef(null)

  useEffect(() => {
    input.current?.focus()
    loadIndex().then(setIndex, () => setFailed(true))
    const { overflow } = document.body.style
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = overflow
    }
  }, [])

  const results = useMemo(() => {
    if (!index) return []
    const q = query.trim()
    if (!q) return index.guides.map((g) => ({ ...g, parts: null }))
    return index.ms.search(q).slice(0, 30).map((r) => ({ ...r, parts: preview(r) }))
  }, [index, query])

  useEffect(() => setActive(0), [query])
  useEffect(() => {
    list.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" })
  }, [active])

  const go = (r) => {
    onClose()
    router.push(href(r))
  }

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault()
      onClose()
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault()
      go(results[active])
    } else if (e.key === "Tab") {
      e.preventDefault() // the dialog has one control; keep focus in it
    }
  }

  // Results grouped under their guide, in rank order of each guide's best hit.
  const groups = []
  results.forEach((r, i) => {
    const key = query.trim() ? r.slug : "all"
    let g = groups.find((x) => x.key === key)
    if (!g) groups.push((g = { key, title: query.trim() ? `Guide ${r.guide} · ${r.page}` : "All guides", items: [] }))
    g.items.push({ r, i })
  })

  return (
    <div className="search-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="search-dialog" role="dialog" aria-modal="true" aria-label="Search the guides" onKeyDown={onKeyDown}>
        <div className="search-field">
          <SearchIcon width={18} height={18} />
          <input
            ref={input}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the guides"
            aria-label="Search the guides"
            aria-controls="search-results"
            aria-activedescendant={results.length ? `search-result-${active}` : undefined}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="search-esc" onClick={onClose} aria-label="Close search">Esc</button>
        </div>

        <div className="search-results" id="search-results" role="listbox" ref={list}>
          {failed ? (
            <p className="search-empty">The search index isn't available. It is built by <code>npm run build</code>.</p>
          ) : !index ? (
            <p className="search-empty">Loading…</p>
          ) : !results.length ? (
            <p className="search-empty">No results for “{query.trim()}”</p>
          ) : (
            groups.map((g) => (
              <section key={g.key} className="search-group">
                <p className="search-group-title">{g.title}</p>
                {g.items.map(({ r, i }) => (
                  <Link
                    key={r.id}
                    href={href(r)}
                    id={`search-result-${i}`}
                    data-i={i}
                    role="option"
                    aria-selected={i === active}
                    className={`search-hit${i === active ? " active" : ""}`}
                    onMouseMove={() => setActive(i)}
                    onClick={onClose}
                  >
                    <span className="search-hit-title">
                      {r.parts ? (
                        <>
                          <span className="search-hit-kind">{r.level === 1 ? "Introduction" : "#"}</span>
                          {r.level === 1 ? null : (
                            <span>
                              <Marked parts={snippet(r.heading, r.terms, 200)} />
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="search-hit-num">{r.guide}</span>
                          {r.page}
                        </>
                      )}
                    </span>
                    {r.parts ? (
                      <span className="search-hit-text">
                        <Marked parts={r.parts} />
                      </span>
                    ) : null}
                  </Link>
                ))}
              </section>
            ))
          )}
        </div>

        <div className="search-foot" aria-hidden="true">
          <span><kbd>↑</kbd><kbd>↓</kbd> to move</span>
          <span><kbd>↵</kbd> to open</span>
          <span><kbd>esc</kbd> to close</span>
        </div>
      </div>
    </div>
  )
}
