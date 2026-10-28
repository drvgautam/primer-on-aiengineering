import { release, repoUrl } from "../../lib/guides"

// The licence and citation line, at the foot of the text column.
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p>
          {release.title} · v{release.version} · Text and figures{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>, code{" "}
          <a href={`${repoUrl}/blob/${release.branch}/LICENSE`}>MIT</a> ·{" "}
          <a href={`${repoUrl}/blob/${release.branch}/CITATION.cff`}>Cite</a>
        </p>
      </div>
    </footer>
  )
}
