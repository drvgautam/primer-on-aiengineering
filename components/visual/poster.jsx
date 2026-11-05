// Building blocks for the one-page visual guides (app/visual/[slug]). Server components: KaTeX
// and the QR code are rendered at build time, so the sheet is static HTML that prints exactly.
import katex from "katex"
import QRCode from "qrcode"
import { allGuides, release } from "../../lib/guides"

export function Poster({ children }) {
  return <article className="poster">{children}</article>
}

export function Masthead({ guide, title, subtitle, thesis }) {
  return (
    <header className="poster-head">
      <p className="poster-kicker">
        {release.title} · Guide {guide.guide} · {guide.part} · Visual guide
      </p>
      <h1 className="poster-title">
        {title}
        {subtitle ? <span className="poster-sub">{subtitle}</span> : null}
      </h1>
      <p className="poster-thesis">{thesis}</p>
    </header>
  )
}

// One step of the sheet: a newcomer's question, numbered in reading order.
export function Step({ n, title, sub, children }) {
  return (
    <section className="band">
      <div className="band-head">
        <span className="band-num">{n}</span>
        <span className="band-title">{title}</span>
        {sub ? <span className="band-sub">{sub}</span> : null}
        <span className="band-rule" />
      </div>
      {children}
    </section>
  )
}

// A panel's title is its lesson; `note` is one optional line under the drawing.
export function Panel({ title, span = 4, note, children, className = "" }) {
  return (
    <div className={`panel span-${span} ${className}`} data-panel={typeof title === "string" ? title : undefined}>
      {title ? <p className="panel-title">{title}</p> : null}
      <div className="panel-art">{children}</div>
      {note ? <p className="panel-note">{note}</p> : null}
    </div>
  )
}

// A term the guide defines; tools/check_visuals.py checks each against the glossary.
export function Term({ children, as }) {
  return (
    <span className="term" data-term={as ?? (typeof children === "string" ? children : undefined)}>
      {children}
    </span>
  )
}

export function Swatch({ color }) {
  return <span className="swatch" style={{ background: color }} />
}

// An SVG arrow from (x1, y1) to (x2, y2), in print points, with an open head.
export function Arrow({ x1, y1, x2, y2, color = "#5f5f6a", w = 0.9, dash }) {
  const a = globalThis.Math.atan2(y2 - y1, x2 - x1), h = 4
  const p = (s) => `${x2 - h * globalThis.Math.cos(a + s)} ${y2 - h * globalThis.Math.sin(a + s)}`
  return (
    <g stroke={color} strokeWidth={w} fill="none">
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={dash} />
      <path d={`M ${p(0.5)} L ${x2} ${y2} L ${p(-0.5)}`} />
    </g>
  )
}

export function Math({ tex, display = false }) {
  return <span dangerouslySetInnerHTML={{ __html: katex.renderToString(tex, { displayMode: display, throwOnError: true }) }} />
}

// The footer: where the guide sits in the series, a QR code to it and its links. The sheet cites
// nothing itself: the guide carries the full argument and its sources. Parts marked data-free
// (the series strip, links, the version) are skipped by the number check.
export async function Footer({ guide }) {
  const owner = release.repo.split("/")
  const site = `https://${owner[0]}.github.io/${owner[1]}/`
  const url = `${site}${guide.slug}/`
  const qr = await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1b1b1fff", light: "#00000000" } })
  const out = new Set(allGuides().map((g) => g.guide))
  const total = allGuides().length + (release.unreleased?.length ?? 0)
  return (
    <footer className="poster-foot">
      <div className="qr" dangerouslySetInnerHTML={{ __html: qr }} />
      <div className="refs">
        <div className="series" aria-label="The series" data-free>
          {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
            <span key={n} className={n === guide.guide ? "here" : out.has(n) ? "out" : ""}>{n}</span>
          ))}
        </div>
        Numbers from the guide&apos;s experiments; the full argument and sources are in the guide. CC BY 4.0.
      </div>
      <div className="links" data-free>
        <b>Read the guide</b>: {url.replace(/^https:\/\//, "")}
        <br />
        <b>Run it</b>: code/notebooks/{guide.notebook}
        <br />
        {release.title} · v{release.version}
      </div>
    </footer>
  )
}
