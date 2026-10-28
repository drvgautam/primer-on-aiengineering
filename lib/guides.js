import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"

const CONTENT = path.join(process.cwd(), "content")
const FENCE = /^(```|~~~)[^\n]*\n[\s\S]*?^\1[ \t]*$/gm

export const release = JSON.parse(fs.readFileSync(path.join(process.cwd(), "release.json"), "utf8"))

// Markdown to plain text, enough for a card or a heading list.
function plain(md) {
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*|__|`/g, "")
    .replace(/\$([^$]+)\$/g, "$1")
    .trim()
}

// "By the end of this guide you'll be able to X." from the guide's opening, as "X."
function outcome(body) {
  const m = body.match(/By the end[^.]*?you'll be able to ([\s\S]*?\.)(?=\s|$)/)
  if (!m) return ""
  const s = plain(m[1])
  return s[0].toUpperCase() + s.slice(1)
}

// Every content/NN-<slug>.mdx with its frontmatter, in series order. The URL slug comes from
// the frontmatter, so the NN- prefix (for browsing the repo) never shows up in links.
export function allGuides() {
  const links = Object.fromEntries(release.parts.flatMap((p) => p.guides.map((g) => [g.slug, g])))
  return fs
    .readdirSync(CONTENT)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const file = f.replace(/\.mdx$/, "")
      const { data, content } = matter(fs.readFileSync(path.join(CONTENT, f), "utf8"))
      const slug = data.slug ?? file.replace(/^\d+-/, "")
      const title = data.title ?? slug
      const [short, tagline = ""] = title.split(/:\s+/, 2)
      const prose = content.replace(FENCE, "").replace(/^import .*$/gm, "").replace(/<[^>]+>/g, "")
      return {
        slug,
        file,
        title,
        short,
        tagline,
        guide: data.guide ?? null,
        part: data.part ?? "",
        blog: links[slug]?.blog ?? null,
        notebook: `${String(data.guide ?? 0).padStart(2, "0")}-${slug}.ipynb`,
        minutes: Math.max(5, Math.round(prose.split(/\s+/).filter(Boolean).length / 230)),
        sections: [...content.matchAll(/^## (.+)$/gm)].map((m) => plain(m[1])),
        outcome: outcome(content),
      }
    })
    .sort((a, b) => (a.guide ?? 999) - (b.guide ?? 999) || a.slug.localeCompare(b.slug))
}

export const repoUrl = `https://github.com/${release.repo}`
export const notebookUrl = (g) => `${repoUrl}/blob/${release.branch}/code/notebooks/${g.notebook}`
export const colabUrl = (g) =>
  `https://colab.research.google.com/github/${release.repo}/blob/${release.branch}/code/notebooks/${g.notebook}`
