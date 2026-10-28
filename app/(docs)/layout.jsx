import { SiteFooter } from "../../components/site/footer"
import { Sidebar } from "../../components/site/sidebar"
import { allGuides, release } from "../../lib/guides"

// The welcome page and every guide share one frame: the series sidebar on the left, the page
// (its text and its "On this page" outline) on the right.
export default function DocsLayout({ children }) {
  const groups = []
  for (const g of allGuides()) {
    if (groups.at(-1)?.name !== g.part) groups.push({ name: g.part || "Guides", items: [] })
    groups.at(-1).items.push({ slug: g.slug, guide: g.guide, short: g.short })
  }
  return (
    <div className="doc-layout">
      <Sidebar groups={groups} coming={release.unreleased?.length ?? 0} />
      {/* The footer sits inside the frame, so the sticky sidebar stays put to the end of the page. */}
      <div className="doc-main">
        <div className="doc-page">{children}</div>
        <SiteFooter />
      </div>
    </div>
  )
}
