import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

const CONTENT = path.join(process.cwd(), "content")

// Every content/NN-<slug>.mdx with its frontmatter, in series order. The URL slug comes from
// the frontmatter, so the NN- prefix (for browsing the repo) never shows up in links.
export function allGuides() {
  return fs
    .readdirSync(CONTENT)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const file = f.replace(/\.mdx$/, "")
      const { data } = matter(fs.readFileSync(path.join(CONTENT, f), "utf8"))
      const slug = data.slug ?? file.replace(/^\d+-/, "")
      return { slug, file, title: data.title ?? slug, guide: data.guide ?? null, part: data.part ?? "" }
    })
    .sort((a, b) => (a.guide ?? 999) - (b.guide ?? 999) || a.slug.localeCompare(b.slug))
}
