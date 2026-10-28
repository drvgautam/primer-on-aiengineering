import Link from "next/link"
import { allGuides, release, repoUrl } from "../lib/guides"
import { Arrow, Download } from "../components/site/icons"

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
const pdf = `${base}/primer-on-aiengineering.pdf`
const cover = `${base}/cover.jpg`

// "119 min" reads better as "about 2 hours".
function readingTime(minutes) {
  if (minutes < 90) return `${minutes} minutes`
  return `about ${Math.round(minutes / 30) / 2} hours`
}

// One line of the contents: number, title and tagline, then the reading time (or "Soon").
function Row({ g }) {
  const body = (
    <>
      <span className="row-num">{String(g.guide).padStart(2, "0")}</span>
      <span className="row-main">
        <span className="row-title">{g.short}</span>
        {g.tagline ? <span className="row-tagline">{g.tagline}</span> : null}
      </span>
      <span className="row-meta">{g.released ? `${g.minutes} min` : "Soon"}</span>
    </>
  )
  return g.released ? (
    <li>
      <Link href={`/${g.slug}/`} className="row">
        {body}
      </Link>
    </li>
  ) : (
    <li>
      <div className="row row-soon">{body}</div>
    </li>
  )
}

export default function Home() {
  const guides = allGuides()
  const unreleased = (release.unreleased ?? []).map((u) => {
    const [short, tagline = ""] = (u.title ?? u.slug).split(/:\s+/, 2)
    return { ...u, short, tagline, released: false }
  })
  const total = guides.length + unreleased.length
  const minutes = guides.reduce((n, g) => n + g.minutes, 0)
  // Every guide, released or not, grouped by part in series order.
  const parts = []
  for (const g of [...guides.map((g) => ({ ...g, released: true })), ...unreleased].sort((a, b) => a.guide - b.guide)) {
    if (parts.at(-1)?.name !== g.part) parts.push({ name: g.part, items: [] })
    parts.at(-1).items.push(g)
  }

  return (
    <div className="home">
      <section className="intro">
        <div>
          <h1>
            How large language models work, <em>built up from one neuron.</em>
          </h1>
          <p className="lede">
            {release.subtitle}. Written for software engineers who have used LLM APIs but never trained a model. Every
            number in the text comes from code you can run.
          </p>
          <div className="actions">
            <Link href={`/${guides[0].slug}/`} className="button button-primary">
              Start reading <Arrow width={16} height={16} />
            </Link>
            <a href={pdf} className="button">
              <Download width={16} height={16} /> Download PDF
            </a>
          </div>
          <p className="intro-meta">
            {guides.length} of {total} guides out · {readingTime(minutes)} of reading ·{" "}
            <a href={`${repoUrl}/tree/${release.branch}/code/notebooks`}>a runnable notebook for each</a>
          </p>
        </div>
        {/* A picture of the book the button downloads, so not a second link to it. */}
        <img className="intro-cover" src={cover} alt="" width={827} height={1000} />
      </section>

      <section id="guides" className="contents" aria-label="The guides">
        {parts.map((p, i) => (
          <div key={p.name} className="contents-part">
            <h2>
              <span>Part {i + 1}</span> {p.name}
            </h2>
            <ol>
              {p.items.map((g) => (
                <Row key={g.slug} g={g} />
              ))}
            </ol>
          </div>
        ))}
      </section>
    </div>
  )
}
