// Print the /book route of the static site to a PDF.
// usage: node book/build-pdf.mjs [--build] [--guide <slug>] [--format A4|Letter] [--out <file>]
//
// --build   run `npm run build` first (otherwise out/ must already exist)
// --guide   print one guide only (the cover, front matter and appendices are dropped)
//
// The PDF gets a page-number footer, a bookmark outline built from the headings, and a
// contents page whose entries link to each guide.

import fs from "node:fs"
import http from "node:http"
import path from "node:path"
import { execSync } from "node:child_process"
import { chromium } from "playwright"

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..")
const OUT_DIR = path.join(ROOT, "out")
const args = process.argv.slice(2)
const opt = (name, dflt) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : dflt
}
const release = JSON.parse(fs.readFileSync(path.join(ROOT, "release.json"), "utf8"))
const guide = opt("--guide", null)
const format = opt("--format", "A4")
const outFile = path.resolve(
  opt("--out", path.join(ROOT, "dist", `primer-on-aiengineering-${release.version}${guide ? `-${guide}` : ""}.pdf`)),
)

if (args.includes("--build")) execSync("npm run build", { cwd: ROOT, stdio: "inherit" })
if (!fs.existsSync(path.join(OUT_DIR, "book", "index.html"))) {
  console.error("out/book/index.html not found: run `npm run build` first, or pass --build")
  process.exit(2)
}

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf", ".svg": "image/svg+xml", ".json": "application/json", ".txt": "text/plain" }
// A GitHub Pages build puts every asset under PAGES_BASE_PATH (/<repo>); serve out/ there too.
const BASE_PATH = process.env.PAGES_BASE_PATH || ""
const server = http.createServer((req, res) => {
  let url = decodeURIComponent(new URL(req.url, "http://x").pathname)
  if (BASE_PATH && url.startsWith(BASE_PATH)) url = url.slice(BASE_PATH.length) || "/"
  let p = path.join(OUT_DIR, url)
  if (!p.startsWith(OUT_DIR)) return res.writeHead(403).end()
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, "index.html")
  if (!fs.existsSync(p)) return res.writeHead(404).end()
  res.writeHead(200, { "content-type": TYPES[path.extname(p)] ?? "application/octet-stream" })
  fs.createReadStream(p).pipe(res)
})
await new Promise((r) => server.listen(0, "127.0.0.1", r))
const base = `http://127.0.0.1:${server.address().port}`

const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  await page.emulateMedia({ media: "print", colorScheme: "light" })
  await page.goto(`${base}${BASE_PATH}/book/`, { waitUntil: "networkidle" })
  await page.waitForSelector("html[data-print-ready]")
  await page.evaluate(() => document.fonts.ready)
  const errors = await page.locator(".katex-error").count()
  if (errors) console.warn(`warning: ${errors} KaTeX error(s) on the page`)

  if (guide) {
    const found = await page.evaluate((slug) => {
      const keep = document.querySelector(`.chapter[data-slug="${slug}"]`)
      if (!keep) return false
      const book = document.querySelector(".book")
      book.replaceChildren(keep)
      keep.style.breakBefore = "auto"
      return true
    }, guide)
    if (!found) throw new Error(`no released guide with slug "${guide}"`)
  }

  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  const small = 'style="font: 8px system-ui, sans-serif; color: #666; width: 100%; padding: 0 18mm;"'
  await page.pdf({
    path: outFile,
    format,
    printBackground: true,
    outline: true,
    tagged: true,
    displayHeaderFooter: true,
    headerTemplate: "<span></span>",
    footerTemplate: `<div ${small}><span>${release.title} · v${release.version}</span><span style="float: right;"><span class="pageNumber"></span></span></div>`,
    margin: { top: "20mm", bottom: "20mm", left: "18mm", right: "18mm" },
  })
  console.log(`wrote ${path.relative(ROOT, outFile)}`)
} finally {
  await browser.close()
  server.close()
}
