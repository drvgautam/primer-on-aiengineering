import Link from "next/link"
import { allGuides, colabUrl, notebookUrl, release, repoUrl } from "../../../lib/guides"
import { Arrow, ArrowLeft, Clock, Flag, Notebook } from "../../../components/site/icons"
import { CodeTools, ReadingProgress, Toc } from "../../../components/site/reading"

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
  const { default: Guide } = await import(`../../../content/${g.file}.mdx`)
  const upcoming = release.unreleased?.[0]
  const erratum = `${repoUrl}/issues/new?template=erratum.yml&title=${encodeURIComponent(`[Guide ${g.guide}] `)}`

  return (
    <>
      <ReadingProgress />
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
            ) : (
              <Link href="/" className="pager-link">
                <span className="pager-dir"><ArrowLeft width={14} height={14} /> Back</span>
                <span className="pager-title">Welcome</span>
              </Link>
            )}
            {next ? (
              <Link href={`/${next.slug}/`} className="pager-link pager-next">
                <span className="pager-dir">Guide {next.guide} <Arrow width={14} height={14} /></span>
                <span className="pager-title">{next.short}</span>
              </Link>
            ) : upcoming ? (
              <div className="pager-link pager-next pager-soon">
                <span className="pager-dir">Coming next: Guide {upcoming.guide}</span>
                <span className="pager-title">{(upcoming.title ?? upcoming.slug).split(":")[0]}</span>
              </div>
            ) : <span />}
          </nav>
        </footer>
      </article>

      <aside className="toc-aside">
        <div className="sidebar-sticky">
          <Toc />
        </div>
      </aside>
      <CodeTools />
    </>
  )
}
