import { allGuides } from "../../lib/guides"
import { PrintProvider } from "../../components/print"
import release from "../../release.json"
import "../../book/print.css"

export const metadata = { title: "Book" }

// Every released guide on one page, in series order, for book/build-pdf.mjs to print.
export default async function Book() {
  const guides = await Promise.all(
    allGuides().map(async (g) => ({ ...g, Guide: (await import(`../../content/${g.file}.mdx`)).default })),
  )
  const parts = []
  for (const g of guides) {
    if (parts.at(-1)?.name !== g.part) parts.push({ name: g.part, guides: [] })
    parts.at(-1).guides.push(g)
  }
  const { default: Glossary } = await import("../../content/appendix/glossary.mdx")
  const { default: Notation } = await import("../../content/appendix/notation.mdx")
  const repo = `https://github.com/${release.repo}`
  const built = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })

  return (
    <PrintProvider>
      <div className="book">
        <section className="cover">
          <p className="cover-kicker">Guides 1–{guides.at(-1).guide}</p>
          <h1 className="cover-title">{release.title}</h1>
          <p className="cover-subtitle">{release.subtitle}</p>
          {release.author ? <p className="cover-author">{release.author}</p> : null}
          <p className="cover-meta">
            Version {release.version} · {built}
            <br />
            {repo}
          </p>
        </section>

        <section className="front">
          <h2>About this book</h2>
          <p>
            This book collects the guides of <em>{release.title}</em>. It's written for a strong software engineer who
            has used LLM APIs but never trained a model. You'll need programming fluency and comfort with matrix
            multiplication; everything else is taught along the way, and later guides build on earlier ones.
          </p>
          <p>
            Every guide is built around code you can run. Each code block in this book appears, in the same order, in
            a Jupyter notebook in the repository's <code>code/notebooks/</code> folder, one notebook per guide. The
            outputs printed here are checked against those notebooks on every change, so running a notebook from top
            to bottom reproduces what you read. Interactive figures from the web edition appear here with all their
            steps drawn in turn, and the optional "going deeper" sections are printed in full.
          </p>
          {release.parts
            .filter((p) => p.blog)
            .map((p) => (
              <p key={p.name}>
                The guides of "{p.name}" are also published on the web, with interactive figures, at {p.blog}.
              </p>
            ))}
          <p>
            Corrections are welcome as issues at {repo}/issues.
          </p>
          <h3>Licence</h3>
          <p>
            The text and figures are licensed under the Creative Commons Attribution 4.0 International licence (CC BY
            4.0). The code is licensed under the MIT licence. See <code>LICENSE-CONTENT</code> and{" "}
            <code>LICENSE</code> in the repository.
          </p>
        </section>

        <nav className="front toc">
          <h2>Contents</h2>
          {parts.map((p) => (
            <div key={p.name}>
              <p className="toc-part">{p.name}</p>
              <ol>
                {p.guides.map((g) => (
                  <li key={g.slug} value={g.guide}>
                    <a href={`#${g.slug}`}>{g.title}</a>
                  </li>
                ))}
              </ol>
            </div>
          ))}
          <p className="toc-part">Appendices</p>
          <ul>
            <li><a href="#glossary">Glossary</a></li>
            <li><a href="#notation">Notation</a></li>
          </ul>
        </nav>

        {parts.map((p, i) => (
          <div key={p.name}>
            <section className="part-title">
              <p>Part {i + 1}</p>
              <h1>{p.name}</h1>
            </section>
            {p.guides.map(({ slug, guide, Guide }) => (
              <section key={slug} id={slug} className="chapter" data-slug={slug}>
                <p className="chapter-number">Guide {guide}</p>
                <Guide />
              </section>
            ))}
          </div>
        ))}

        <section id="glossary" className="chapter appendix">
          <Glossary />
        </section>
        <section id="notation" className="chapter appendix">
          <Notation />
        </section>
      </div>
    </PrintProvider>
  )
}
