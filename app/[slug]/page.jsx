import Link from "next/link"
import { allGuides, colabUrl, notebookUrl, release, repoUrl } from "../../lib/guides"
import { Arrow, ArrowLeft, Clock, Flag, Notebook } from "../../components/site/icons"
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
    const { default: Guide } = await import(`../../content/${g.file}.mdx`)
  // the sidebar: the released guides, grouped by part in series order
  const sidebar = []
  for (const x of guides) {
    if (sidebar.at(-1)?.name !== x.part) sidebar.push({ name: x.part, items: [] })
    sidebar.at(-1).items.push(x)
  }
  const coming = release.unreleased?.length ?? 0
  const erratum = `${repoUrl}/issues/new?template=erratum.yml&title=${encodeURIComponent(`[Guide ${g.guide}] `)}`

  return (
    <>
      <ReadingProgress />
      <div className="guide-layout">
        <aside className="series-nav" aria-label="All guides">
          <div className="sidebar-sticky">
            {sidebar.map((p) => (
              <div key={p.name} className="series-part">
                <p className="sidebar-label">{p.name || "Guides"}</p>
                <ol>
                  {p.items.map((x) => (
                    <li key={x.slug}>
                      <Link href={`/${x.slug}/`} className={x.slug === slug ? "active" : undefined} aria-current={x.slug === slug ? "page" : undefined}>
                        <span className="series-num">{x.guide}</span>
                        {x.short}
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
            {coming ? <p className="series-coming">{coming} more guides coming</p> : null}
          </div>
        </aside>

        <article className="prose">
          <header className="guide-head">
            <p className="guide-kicker">
              <span>Guide {g.guide}</span>
              <span>
                <Clock width={14} height={14} /> {g.minutes} min read
              </span>
              <a href={colabUrl(g)} className="kicker-action">
                <Notebook width={15} height={15} /> Run the code in Colab
              </a>
            </p>
            <Toc collapsible />
          </header>

          <Guide />

          <footer className="guide-foot">
            <p className="guide-foot-links">
              <a href={erratum}>
                <Flag width={15} height={15} /> Report an error in this guide
              </a>
              <a href={notebookUrl(g)}>View the notebook on GitHub</a>
            </p>
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
