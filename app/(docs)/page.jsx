import Link from "next/link"
import { allGuides, release, repoUrl } from "../../lib/guides"
import { Arrow, Book, Download, Notebook } from "../../components/site/icons"
import { Toc } from "../../components/site/reading"

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
const pdf = `${base}/primer-on-aiengineering.pdf`

// "119 min" reads better as "about 2 hours".
function readingTime(minutes) {
  if (minutes < 90) return `${minutes} minutes`
  return `about ${Math.round(minutes / 30) / 2} hours`
}

// What each part covers, for "What you'll learn". A part not listed here falls back to its
// guides' taglines.
const summaries = {
  "How LLMs work":
    "Take a language model apart, one layer at a time: a neural network and how it learns, how text becomes tokens, embeddings, attention, the transformer block, and how next-token probabilities become text.",
  Lifecycle:
    "Follow a model from raw text to a working product: pre-training, fine-tuning, alignment, inference and serving, tool use and agents, and retrieval-augmented generation.",
}

export default function Welcome() {
  const guides = allGuides()
  const first = guides[0]
  const unreleased = (release.unreleased ?? []).map((u) => {
    const [short, tagline = ""] = (u.title ?? u.slug).split(/:\s+/, 2)
    return { ...u, short, tagline, released: false }
  })
  const minutes = guides.reduce((n, g) => n + g.minutes, 0)
  // Every guide, released or not, grouped by part in series order.
  const parts = []
  for (const g of [...guides.map((g) => ({ ...g, released: true })), ...unreleased].sort((a, b) => a.guide - b.guide)) {
    if (parts.at(-1)?.name !== g.part) parts.push({ name: g.part, items: [] })
    parts.at(-1).items.push(g)
  }

  return (
    <>
      <article className="prose welcome">
        <h1>Welcome to {release.title}</h1>
        <p className="lede">
          {release.subtitle}, built up from a single neuron. Written for software engineers who have used LLM APIs but
          never trained a model. Every number in the text comes from code you can run.
        </p>
        <p className="welcome-meta">
          {guides.length} of {guides.length + unreleased.length} guides out · {readingTime(minutes)} of reading ·
          free and open source
        </p>

        <h2 id="get-started">Get started</h2>
        <div className="start-grid">
          <Link href={`/${first.slug}/`} className="start-card start-card-primary">
            <Book />
            <strong>Read online</strong>
            <span>Begin with Guide 1, {first.short.toLowerCase()}, and follow the sidebar in order.</span>
          </Link>
          <a href={pdf} className="start-card">
            <Download />
            <strong>Download the book</strong>
            <span>Every guide in one PDF, with each figure drawn step by step.</span>
          </a>
          <a href={`${repoUrl}/tree/${release.branch}/code/notebooks`} className="start-card">
            <Notebook />
            <strong>Run the notebooks</strong>
            <span>One Jupyter notebook per guide, on your laptop or in Colab.</span>
          </a>
        </div>

        <h2 id="what-youll-learn">What you&apos;ll learn</h2>
        {parts.map((p, i) => {
          const out = p.items.filter((g) => g.released).length
          return (
            <div key={p.name} className="learn-part">
              <p className="learn-label">
                <span>Part {i + 1}</span> {p.name}
                <em>{out === p.items.length ? `${out} guides` : `${out} of ${p.items.length} guides out`}</em>
              </p>
              <p>{summaries[p.name] ?? p.items.map((g) => g.tagline || g.short).join(", ")}</p>
            </div>
          )
        })}

        <h2 id="how-to-read">How to read it</h2>
        <ul>
          <li>
            <strong>In order.</strong> Each guide builds on the ones before it, so start at Guide 1 even if you know
            some of the early material.
          </li>
          <li>
            <strong>With one running example.</strong> The guides share one sentence, “The cat sat on the”, so each
            new idea shows up on text you already know.
          </li>
          <li>
            <strong>With the code open.</strong> Every block runs on a laptop CPU. Its printed output is pasted from a
            real run, and CI re-runs each notebook against the text.
          </li>
          <li>
            <strong>Tell us when it&apos;s wrong.</strong> Errata and “this doesn&apos;t reproduce on my machine”
            reports are welcome as <a href={`${repoUrl}/issues/new/choose`}>GitHub issues</a>.
          </li>
        </ul>

        <footer className="guide-foot">
          <nav className="pager" aria-label="Next page">
            <span />
            <Link href={`/${first.slug}/`} className="pager-link pager-next">
              <span className="pager-dir">
                Next: Guide {first.guide} <Arrow width={14} height={14} />
              </span>
              <span className="pager-title">{first.short}</span>
            </Link>
          </nav>
        </footer>
      </article>

      <aside className="toc-aside">
        <div className="sidebar-sticky">
          <Toc />
        </div>
      </aside>
    </>
  )
}
