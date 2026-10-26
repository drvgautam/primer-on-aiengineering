import Link from "next/link"
import { allGuides, colabUrl, notebookUrl, release, repoUrl } from "../../lib/guides"
import { Arrow, ArrowLeft, Clock, External, Flag, Notebook } from "../../components/site/icons"
import { CodeTools, ReadingProgress, Toc } from "../../components/site/reading"

export const dynamicParams = false

export function generateStaticParams() {
  return allGuides().map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const guide = allGuides().find((g) => g.slug === slug)
  return { title: guide?.title ?? slug, description: guide?.outcome || undefined }
}

export default async function GuidePage({ params }) {
  const { slug } = await params
  const guides = allGuides()
  const i = guides.findIndex((g) => g.slug === slug)
  const g = guides[i]
  const [prev, next] = [guides[i - 1], guides[i + 1]]
  const total = guides.length + (release.unreleased?.length ?? 0)
  const { default: Guide } = await import(`../../content/${g.file}.mdx`)
  const erratum = `${repoUrl}/issues/new?template=erratum.yml&title=${encodeURIComponent(`[Guide ${g.guide}] `)}`

  return (
    <>
      <ReadingProgress />
      <div className="guide-layout">
        <aside className="series-nav" aria-label="All guides">
          <div className="sidebar-sticky">
            <p className="sidebar-label">{g.part || "Guides"}</p>
            <ol>
              {guides.map((x) => (
                <li key={x.slug}>
                  <Link href={`/${x.slug}/`} className={x.slug === slug ? "active" : undefined} aria-current={x.slug === slug ? "page" : undefined}>
                    <span className="series-num">{x.guide}</span>
                    {x.short}
                  </Link>
                </li>
              ))}
              {(release.unreleased ?? []).map((u) => (
                <li key={u.slug} className="series-soon">
                  <span>
                    <span className="series-num">{u.guide}</span>
                    {(u.title ?? u.slug).split(":")[0]}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <article className="prose">
          <header className="guide-head">
            <p className="guide-kicker">
              {g.part ? <span>{g.part}</span> : null}
              <span>Guide {g.guide} of {total}</span>
              <span><Clock width={14} height={14} /> {g.minutes} min read</span>
            </p>
            <div className="guide-actions">
              <a href={colabUrl(g)} className="chip chip-accent">
                <Notebook width={15} height={15} /> Run in Colab
              </a>
              <a href={notebookUrl(g)} className="chip">Notebook on GitHub</a>
              {g.blog ? (
                <a href={g.blog} className="chip">
                  On the blog <External width={13} height={13} />
                </a>
              ) : null}
            </div>
            <Toc collapsible />
          </header>

          <Guide />

          <footer className="guide-foot">
            <a href={erratum} className="erratum">
              <Flag width={15} height={15} /> Spotted an error in this guide? Report it
            </a>
            <nav className="pager" aria-label="Previous and next guide">
              {prev ? (
                <Link href={`/${prev.slug}/`} className="pager-link">
                  <span className="pager-dir"><ArrowLeft width={14} height={14} /> Guide {prev.guide}</span>
                  <span className="pager-title">{prev.short}</span>
                </Link>
              ) : <span />}
              {next ? (
                <Link href={`/${next.slug}/`} className="pager-link pager-next">
                  <span className="pager-dir">Guide {next.guide} <Arrow width={14} height={14} /></span>
                  <span className="pager-title">{next.short}</span>
                </Link>
              ) : (
                <Link href="/#guides" className="pager-link pager-next">
                  <span className="pager-dir">More soon <Arrow width={14} height={14} /></span>
                  <span className="pager-title">Back to all guides</span>
                </Link>
              )}
            </nav>
          </footer>
        </article>

        <aside className="toc-aside">
          <div className="sidebar-sticky">
            <Toc />
          </div>
        </aside>
      </div>
      <CodeTools />
    </>
  )
}
