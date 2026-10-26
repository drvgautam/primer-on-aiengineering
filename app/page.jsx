import Link from "next/link"
import { allGuides, colabUrl, notebookUrl, release, repoUrl, sampleBlock } from "../lib/guides"
import { Arrow, Book, Clock, Download, GitHub, Notebook } from "../components/site/icons"

const pdf = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/primer-on-aiengineering.pdf`

function GuideCard({ g }) {
  return (
    <li className="guide-card">
      <Link href={`/${g.slug}/`} className="guide-card-link">
        <span className="guide-number">{String(g.guide).padStart(2, "0")}</span>
        <h3>
          {g.short}
          {g.tagline ? <span className="guide-tagline">{g.tagline}</span> : null}
        </h3>
        {g.outcome ? <p className="guide-outcome">{g.outcome}</p> : null}
      </Link>
      <div className="guide-meta">
        <span><Clock width={14} height={14} /> {g.minutes} min</span>
        <span>{g.sections.length} sections</span>
        <a href={notebookUrl(g)}>Notebook</a>
        <a href={colabUrl(g)}>Colab</a>
      </div>
    </li>
  )
}

export default function Home() {
  const guides = allGuides()
  const sample = sampleBlock("attention")
  const totalMinutes = guides.reduce((n, g) => n + g.minutes, 0)
  const parts = release.parts.map((p) => ({ ...p, guides: guides.filter((g) => g.part === p.name) }))
  const upcoming = []
  for (const u of release.unreleased ?? []) {
    if (upcoming.at(-1)?.[0] !== u.part) upcoming.push([u.part ?? "", []])
    upcoming.at(-1)[1].push(u)
  }
  const total = guides.length + (release.unreleased?.length ?? 0)

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">
            <span className="badge">v{release.version}</span> Free and open source · {guides.length} of {total} guides out
          </p>
          <h1>
            How large language models work, <em>built up from one neuron.</em>
          </h1>
          <p className="lede">
            {release.subtitle}. Written for software engineers who have used LLM APIs but never trained a model. Every
            number in the text comes from code you can run.
          </p>
          <div className="cta-row">
            <Link href={`/${guides[0].slug}/`} className="button button-primary">
              Start with Guide 1 <Arrow width={16} height={16} />
            </Link>
            <a href={pdf} className="button">
              <Download width={16} height={16} /> PDF
            </a>
            <a href={repoUrl} className="button">
              <GitHub width={16} height={16} /> GitHub
            </a>
          </div>
          <p className="byline">By {release.author}</p>
        </div>
        {sample ? (
          <figure className="hero-card" aria-label={`A code block from Guide ${sample.guide.guide}`}>
            <div className="hero-card-bar">
              <span className="dots" aria-hidden="true"><i /><i /><i /></span>
              <span>{sample.guide.notebook}</span>
            </div>
            <pre><code>{sample.code}</code></pre>
            <pre className="hero-output"><code>{sample.output}</code></pre>
            <figcaption>
              Attention weights for “the cat sat on the”, from{" "}
              <Link href={`/${sample.guide.slug}/`}>Guide {sample.guide.guide}</Link>. Each row sums to 1; the zeros
              are the causal mask.
            </figcaption>
          </figure>
        ) : null}
      </section>

      <section className="stats" aria-label="At a glance">
        <div><strong>{guides.length}</strong><span>guides published</span></div>
        <div><strong>{totalMinutes} min</strong><span>total reading</span></div>
        <div><strong>{guides.length}</strong><span>runnable notebooks</span></div>
        <div><strong>0</strong><span>hand-typed outputs</span></div>
      </section>

      <section className="ways" aria-labelledby="ways-title">
        <h2 id="ways-title" className="section-title">Three ways to read</h2>
        <div className="ways-grid">
          <Link href={`/${guides[0].slug}/`} className="way">
            <Book />
            <h3>On the web</h3>
            <p>Interactive figures you can step through, maths typeset, light and dark mode.</p>
          </Link>
          <a href={pdf} className="way">
            <Download />
            <h3>As a book</h3>
            <p>Every guide in one PDF, with all figure steps drawn and the “going deeper” sections in full.</p>
          </a>
          <a href={`${repoUrl}/tree/${release.branch}/code/notebooks`} className="way">
            <Notebook />
            <h3>In a notebook</h3>
            <p>One Jupyter notebook per guide, runnable locally or on Colab. CI checks each against the text.</p>
          </a>
        </div>
      </section>

      <section id="guides" className="curriculum" aria-labelledby="guides-title">
        <h2 id="guides-title" className="section-title">The guides</h2>
        <p className="section-lede">
          Read them in order: each guide builds on the ones before it, and they share one running example, “The cat
          sat on the”.
        </p>
        {parts.map((p, i) => (
          <div key={p.name} className="part">
            <div className="part-head">
              <span className="part-label">Part {i + 1}</span>
              <h3>{p.name}</h3>
              {p.blog ? <a href={p.blog} className="part-link">Also on the blog</a> : null}
            </div>
            <ol className="guide-grid">
              {p.guides.map((g) => <GuideCard key={g.slug} g={g} />)}
            </ol>
          </div>
        ))}
        {upcoming.map(([name, items], i) => (
          <div key={name} className="part part-upcoming">
            <div className="part-head">
              <span className="part-label">Part {parts.length + i + 1}</span>
              <h3>{name}</h3>
              <span className="soon">Coming in the next release</span>
            </div>
            <ol className="guide-grid">
              {items.map((u) => {
                const [short, tagline] = (u.title ?? u.slug).split(/:\s+/, 2)
                return (
                  <li key={u.slug} className="guide-card upcoming">
                    <div className="guide-card-link">
                      <span className="guide-number">{String(u.guide).padStart(2, "0")}</span>
                      <h3>
                        {short}
                        {tagline ? <span className="guide-tagline">{tagline}</span> : null}
                      </h3>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
      </section>

      <section className="contribute">
        <div>
          <h2>Found something wrong?</h2>
          <p>
            Errata and “this doesn&apos;t reproduce on my machine” reports are the most useful contributions. Each one
            is checked against the code and fixed at the source.
          </p>
        </div>
        <div className="cta-row">
          <a href={`${repoUrl}/issues/new/choose`} className="button button-primary">Open an issue</a>
          <a href={`${repoUrl}/blob/${release.branch}/CONTRIBUTING.md`} className="button">How to contribute</a>
        </div>
      </section>
    </div>
  )
}
