// Builds out/search-index.json from the exported guide pages, one record per section.
// Runs after `next build` (npm's postbuild hook), so the anchors and text are exactly what the
// reader sees: heading ids from rehype-slug, math as KaTeX renders it, code as printed.
import fs from "node:fs"
import path from "node:path"
import { fromHtml } from "hast-util-from-html"
import { allGuides } from "../lib/guides.js"

const OUT = path.join(process.cwd(), "out")

const cls = (node) => [].concat(node.properties?.className ?? [])
// Text the reader can't see as prose: MathML duplicates of KaTeX, figure drawings, controls,
// and the printed outputs of code blocks (numbers that would only add noise).
const skip = (node) =>
  ["svg", "button", "script", "style"].includes(node.tagName) ||
  cls(node).includes("katex-mathml") ||
  cls(node).includes("language-output")
const BLOCK = new Set(["p", "li", "pre", "div", "figcaption", "td", "th", "summary", "blockquote", "dd", "dt"])

function text(node) {
  if (node.type === "text") return node.value
  if (node.type !== "element" && node.type !== "root") return ""
  if (node.type === "element" && skip(node)) return ""
  const inner = (node.children ?? []).map(text).join("")
  return node.type === "element" && BLOCK.has(node.tagName) ? ` ${inner} ` : inner
}
const clean = (s) => s.replace(/[​‌‍]/g, "").replace(/\s+/g, " ").trim()

function find(node, test) {
  if (test(node)) return node
  for (const c of node.children ?? []) {
    const hit = find(c, test)
    if (hit) return hit
  }
  return null
}

const records = []
for (const g of allGuides()) {
  const file = path.join(OUT, g.slug, "index.html")
  const tree = fromHtml(fs.readFileSync(file, "utf8"))
  const article = find(tree, (n) => n.tagName === "article")
  if (!article) throw new Error(`no <article> in ${file}`)
  let section = null
  const start = (heading, anchor, level) => {
    section = { id: records.length, slug: g.slug, guide: g.guide, page: g.short, heading, anchor, level, text: "", code: "" }
    records.push(section)
  }
  start(g.short, "", 1)
  // Depth-first through the guide body, skipping the page's own header (kicker, chips, TOC)
  // and footer (pager); each h2 or h3 starts a new section.
  // Code goes in its own field: searchable, but the result preview quotes the prose.
  const walk = (node, field = "text") => {
    if (node.type === "element") {
      if (["header", "footer"].includes(node.tagName) && node !== article) return
      if (skip(node)) return
      if (/^h[23]$/.test(node.tagName) && node.properties?.id) {
        start(clean(text(node)), String(node.properties.id), Number(node.tagName[1]))
        return
      }
      if (node.tagName === "h1") return
      if (node.tagName === "pre") field = "code"
    }
    if (node.type === "text") section[field] += node.value
    else {
      for (const c of node.children ?? []) walk(c, field)
      if (node.type === "element" && BLOCK.has(node.tagName)) section[field] += " "
    }
  }
  walk(article)
}
for (const r of records) [r.text, r.code] = [clean(r.text), clean(r.code)]

const dest = path.join(OUT, "search-index.json")
fs.writeFileSync(dest, JSON.stringify(records))
console.log(`search index: ${records.length} sections, ${(fs.statSync(dest).size / 1024).toFixed(0)} KB`)
